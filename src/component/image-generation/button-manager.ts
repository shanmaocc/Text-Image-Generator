import { getSettings } from '../services/ui-manager';
import { safeAttr } from '../utils/security';

/**
 * 创建生成图片按钮的HTML
 */
export function createGenerateButtonHTML(mesId: string): string {
    const safeMesId = safeAttr(mesId);
    return `
        <button class="generate-image-btn" data-mes-id="${safeMesId}">
            <span class="btn-text">生成图片</span>
            <i class="fa-solid fa-spinner fa-spin btn-loading" style="display:none;margin-left:8px;"></i>
        </button>
    `;
}

/**
 * 创建停止按钮的HTML
 */
export function createStopButtonHTML(mesId: string): string {
    const safeMesId = safeAttr(mesId);
    return `
        <button class="stop-image-btn" data-mes-id="${safeMesId}" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); border: none; border-radius: 4px; color: white; padding: 4px 8px; font-size: 11px; font-weight: 500; cursor: pointer; transition: 0.3s; box-shadow: rgba(255, 107, 107, 0.3) 0px 1px 4px; margin: 4px 0px 4px 8px; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; vertical-align: middle;">
            <i class="fa-solid fa-stop" style="font-size: 10px;"></i>
            <span>停止</span>
        </button>
    `;
}

/**
 * 应用按钮样式
 */
export function applyButtonStyles($button: JQuery): void {
    $button.css({
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
        'border-radius': '8px',
        color: 'white',
        padding: '8px 16px',
        'font-size': '14px',
        'font-weight': '500',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        'box-shadow': '0 2px 8px rgba(102, 126, 234, 0.3)',
        margin: '8px 0',
        display: 'inline-flex',
        'flex-direction': 'row',
        'align-items': 'center',
        gap: '8px',
        'white-space': 'nowrap',
    });
}

/**
 * 设置按钮悬停效果
 */
export function setupButtonHoverEffects($button: JQuery): void {
    $button.hover(
        function () {
            $(this).css({
                transform: 'translateY(-2px)',
                'box-shadow': '0 4px 12px rgba(102, 126, 234, 0.4)',
            });
        },
        function () {
            $(this).css({
                transform: 'translateY(0)',
                'box-shadow': '0 2px 8px rgba(102, 126, 234, 0.3)',
            });
        }
    );
}

/**
 * 添加生成图片按钮
 */
export function addGenerateImageButton(
    $message: JQuery,
    $imgContainer: JQuery,
    mesId: string
): void {
    const $button = $(createGenerateButtonHTML(mesId));
    applyButtonStyles($button);
    setupButtonHoverEffects($button);
    $imgContainer.before($button);
}

/**
 * 恢复按钮状态
 */
export function resetButtonState($btn: JQuery): void {
    const $btnText = $btn.find('.btn-text');
    const $btnLoading = $btn.find('.btn-loading');

    $btn.removeClass('generating');
    $btnText.text('生成图片').show();
    $btnLoading.hide();
    $btn.prop('disabled', false).removeClass('disabled');
    $btn.siblings('.stop-image-btn').remove();
}

/**
 * 设置删除监听器
 * 监听删除图片操作
 */
export function setupDeleteListener(): void {
    $(document).on('click', function (event) {
        const target = event.target as unknown as HTMLElement;
        if (!target || target.nodeType !== Node.ELEMENT_NODE) return;
        const $target = $(target);
        const text = $target.text().toLowerCase();
        if (text.includes('delete one') || text.includes('delete all')) {
            setTimeout(() => {
                checkAndAddButtonsForDeletedImages();
            }, 400);
        }
    });
}

/**
 * 检查并添加按钮
 * 只检查最近的消息，减少性能开销
 */
function checkAndAddButtonsForDeletedImages(): void {
    const chatContainer = $('#chat');
    const recentMessages = chatContainer.find('.mes').slice(-20);
    recentMessages.each((index, element) => {
        const $message = $(element);
        const mesId = $message.attr('mesid');
        const isUserMessage =
            $message.attr('is_user') === 'true' || $message.hasClass('user-message');
        if (!isUserMessage && mesId) {
            const $imgContainer = $message.find('.mes_img_container');
            if (
                $imgContainer.length > 0 &&
                $imgContainer.is(':hidden') &&
                !$message.find('.generate-image-btn').length
            ) {
                addGenerateImageButton($message, $imgContainer, mesId);
            }
        }
    });
}

/**
 * 延迟检查主站是否在生成中
 */
export async function isMainGeneratingDelayed(delayMs: number = 0): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    const value = (document?.body as HTMLElement | undefined)?.dataset?.generating;
    return value === 'true';
}

/**
 * 同步生成图片按钮状态
 */
export async function syncGenerateButtonStateForMessage(
    $message: JQuery,
    mesId: string,
    extensionEnabled?: boolean
): Promise<void> {
    // 如果没有传入 extensionEnabled，从设置中获取
    const settings = getSettings();
    const isEnabled = extensionEnabled !== undefined ? extensionEnabled : settings.extensionEnabled;

    if (!isEnabled) {
        logger.info('Extension disabled, removing generate buttons');
        const $ImageBtn = $message.find('.generate-image-btn');
        if ($ImageBtn.length) {
            $ImageBtn.remove();
        }
        return;
    }

    const $ImageBtn = $message.find('.generate-image-btn');
    if ($ImageBtn.length) {
        $ImageBtn.remove();
    }

    if (await isMainGeneratingDelayed(1)) {
        return;
    }

    const $imgContainer = $message.find('.mes_img_container');

    logger.debug(
        `[mesId:${mesId}] Container found: ${$imgContainer.length}, visible: ${$imgContainer.is(':visible')}, display: ${$imgContainer.css('display')}`
    );

    // 如果容器可见（display不是none，说明有图片），不添加按钮
    if ($imgContainer.is(':visible')) {
        logger.info(`[mesId:${mesId}] Container is visible (has image), not adding button`);
        return;
    }

    // 容器隐藏（display:none，说明没有图片），添加按钮
    logger.info(`[mesId:${mesId}] Container is hidden (no image), adding button`);
    addGenerateImageButton($message, $imgContainer, mesId);
}
