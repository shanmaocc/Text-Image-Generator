// 工作流管理服务模块
import { Popup, POPUP_TYPE } from '@sillytavern/scripts/popup';
import { deleteWorkflowFile, loadWorkflowFile, loadWorkflowList, saveWorkflowFile } from './api-service';
import { getSettings, saveSetting } from './ui-manager';

const PLACEHOLDERS = [
    'prompt',
    'negative_prompt',
    'model',
    'vae',
    'sampler',
    'scheduler',
    'steps',
    'scale',
    'denoise',
    'clip_skip',
    'width',
    'height',
    'user_avatar',
    'char_avatar',
];

const CUSTOM_PH_STORAGE_KEY = 'textToPicCustomPlaceholders';

/**
 * 获取自定义占位符
 */
function getCustomPlaceholders(): Array<{find: string, replace: string}> {
    const raw = localStorage.getItem(CUSTOM_PH_STORAGE_KEY);
    try {
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/**
 * 保存自定义占位符
 */
function saveCustomPlaceholders(placeholders: Array<{find: string, replace: string}>): void {
    localStorage.setItem(CUSTOM_PH_STORAGE_KEY, JSON.stringify(placeholders));
}

/**
 * 更新工作流选择框
 */
export async function updateWorkflowSelect(): Promise<void> {
    try {
        const workflows = await loadWorkflowList();
    const select = $('#comfy-workflow-select');
    select.empty();
    select.append('<option value="">-- 未选择 --</option>');

        workflows.forEach(workflow => {
            const option = document.createElement('option');
            option.value = workflow;
            option.text = workflow;
            select.append(option);
        });

        // 恢复选中的工作流
    const settings = getSettings();
        if (settings.comfyWorkflowName && workflows.includes(settings.comfyWorkflowName)) {
            select.val(settings.comfyWorkflowName);
        }
    } catch (error) {
        console.error('Failed to load workflows:', error);
        const select = $('#comfy-workflow-select');
        select.empty();
        select.append('<option value="">-- 加载工作流失败 --</option>');
    }
}

/**
 * 获取当前选中的工作流
 */
export async function getSelectedWorkflow(): Promise<any> {
    const settings = getSettings();
    const workflowName = settings.comfyWorkflowName;

    if (!workflowName) {
        return null;
    }

    try {
        const workflowContent = await loadWorkflowFile(workflowName);
        const workflow = JSON.parse(workflowContent);

        // 替换占位符
        const result = replaceWorkflowPlaceholders(workflow);
        return result;
    } catch (error) {
        log.error(`Failed to load workflow ${workflowName}:`, error);
        return null;
    }
}

/**
 * 替换工作流中的占位符
 */
function replaceWorkflowPlaceholders(workflow: any): any {
    const settings = getSettings();

    // 深拷贝工作流以避免修改原始数据
    const workflowCopy = JSON.parse(JSON.stringify(workflow));

    // 替换占位符
    const workflowStr = JSON.stringify(workflowCopy);
    let result = workflowStr;

    // 替换基本占位符
    // 注意：%prompt% 和 %negative_prompt% 不在这里替换，而是在调用时动态替换
    result = result.replace(/%model%/g, settings.sd_model || '');
    result = result.replace(/%vae%/g, settings.sd_vae || '');
    result = result.replace(/%sampler%/g, settings.sd_sampler || '');
    result = result.replace(/%scheduler%/g, settings.sd_scheduler || '');
    result = result.replace(/%steps%/g, String(settings.sd_steps || 20));

    result = result.replace(/%scale%/g, String(settings.sd_scale || 7));
    result = result.replace(/%denoise%/g, String(settings.sd_denoising_strength || 0.7));
    result = result.replace(/%clip_skip%/g, String(settings.sd_clip_skip || 1));
    result = result.replace(/%width%/g, String(settings.sd_width || 1024));
    result = result.replace(/%height%/g, String(settings.sd_height || 1024));

    // 处理种子
    const seed = settings.sd_seed >= 0 ? settings.sd_seed : Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
    result = result.replace(/%seed%/g, String(seed));

    // 暂时跳过自定义占位符处理，专注于基本占位符
    // const customPlaceholders = getCustomPlaceholders();
    // customPlaceholders.forEach(placeholder => {
    //     if (placeholder.find && placeholder.replace) {
    //         result = result.replace(new RegExp(placeholder.find, 'g'), placeholder.replace);
    //     }
    // });

    try {
        return JSON.parse(result);
    } catch (error) {
        log.error('Failed to parse workflow after placeholder replacement:', error);
        log.error('Problematic JSON string:', result.substring(0, 1000));
        // 返回原始工作流，让后续处理继续
        return workflowCopy;
    }
}

/**
 * 打开工作流编辑器
 */
export async function openWorkflowEditor(): Promise<void> {
    const settings = getSettings();
    const workflowName = settings.comfyWorkflowName;

    if (!workflowName) {
        toastr.error('请先选择一个工作流');
        return;
    }

    try {
        const workflowContent = await loadWorkflowFile(workflowName);

        // 加载工作流编辑器HTML模板
        const editorHtml = $(await $.get('scripts/extensions/third-party/Text-Image-Generator/comfyWorkflowEditor.html'));

        const saveValue = (_popup: any) => {
            workflow = $('#sd_comfy_workflow_editor_workflow').val()?.toString() || '';
            return true;
        };

        const popup = new Popup(editorHtml, POPUP_TYPE.CONFIRM, '', {
        okButton: '保存',
        cancelButton: '取消',
            wide: true,
            large: true,
            onClosing: saveValue
        });

        const popupResult = popup.show();
        let workflow = workflowContent;

        const checkPlaceholders = () => {
            workflow = $('#sd_comfy_workflow_editor_workflow').val()?.toString() || '';
            $('.sd_comfy_workflow_editor_placeholder_list > li[data-placeholder]').each(function () {
                const key = this.getAttribute('data-placeholder');
                const found = workflow.search(`"%${key}%"`) !== -1;
                this.classList[found ? 'remove' : 'add']('sd_comfy_workflow_editor_not_found');
            });
        };

        $('#sd_comfy_workflow_editor_name').text(workflowName);
        $('#sd_comfy_workflow_editor_workflow').val(workflow);

        const addPlaceholderDom = (placeholder: {find: string, replace: string}) => {
            const el = $(`
                <li class="sd_comfy_workflow_editor_not_found" data-placeholder="${placeholder.find}">
            <span class="sd_comfy_workflow_editor_custom_remove" title="Remove custom placeholder">⊘</span>
                    <span class="sd_comfy_workflow_editor_custom_final">"%${placeholder.find}%"</span><br>
            <input placeholder="find" title="find" type="text" class="text_pole sd_comfy_workflow_editor_custom_find" value=""><br>
            <input placeholder="replace" title="replace" type="text" class="text_pole sd_comfy_workflow_editor_custom_replace">
        </li>
            `);
            $('#sd_comfy_workflow_editor_placeholder_list_custom').append(el);
            el.find('.sd_comfy_workflow_editor_custom_find').val(placeholder.find);
            el.find('.sd_comfy_workflow_editor_custom_find').on('input', function () {
                if (!(this instanceof HTMLInputElement)) {
                    return;
                }
                placeholder.find = this.value;
                el.find('.sd_comfy_workflow_editor_custom_final').text(`"%${this.value}%"`);
                el.attr('data-placeholder', `${this.value}`);
                checkPlaceholders();
                saveCustomPlaceholders(getCustomPlaceholders());
            });
            el.find('.sd_comfy_workflow_editor_custom_replace').val(placeholder.replace);
            el.find('.sd_comfy_workflow_editor_custom_replace').on('input', function () {
                if (!(this instanceof HTMLInputElement)) {
                    return;
                }
                placeholder.replace = this.value;
                saveCustomPlaceholders(getCustomPlaceholders());
            });
            el.find('.sd_comfy_workflow_editor_custom_remove').on('click', () => {
                el.remove();
                const placeholders = getCustomPlaceholders();
                const index = placeholders.indexOf(placeholder);
                if (index > -1) {
                    placeholders.splice(index, 1);
                    saveCustomPlaceholders(placeholders);
                }
        });
    };

        $('#sd_comfy_workflow_editor_placeholder_add').on('click', () => {
            const placeholders = getCustomPlaceholders();
            const placeholder = {
                find: '',
                replace: '',
            };
            placeholders.push(placeholder);
            saveCustomPlaceholders(placeholders);
            addPlaceholderDom(placeholder);
        });

        // 加载现有的自定义占位符
        getCustomPlaceholders().forEach(placeholder => {
            addPlaceholderDom(placeholder);
        });

        checkPlaceholders();
        $('#sd_comfy_workflow_editor_workflow').on('input', checkPlaceholders);

        if (await popupResult) {
            await saveWorkflowFile(workflowName, workflow);
            toastr.success('工作流保存成功');
        }
    } catch (error) {
        console.error('Failed to open workflow editor:', error);
        toastr.error('打开工作流编辑器失败');
    }
}

/**
 * 创建新工作流
 */
export async function createNewWorkflow(): Promise<void> {
    const name = prompt('请输入新工作流的名称:');
    if (!name) return;

    const fileName = name.endsWith('.json') ? name : `${name}.json`;

    try {
        await saveWorkflowFile(fileName, '{}');
        toastr.success(`工作流 ${fileName} 创建成功`);
        await updateWorkflowSelect();

        // 自动选择新创建的工作流
        saveSetting('comfyWorkflowName', fileName);
        $('#comfy-workflow-select').val(fileName);
    } catch (error) {
        console.error('Failed to create workflow:', error);
        toastr.error('创建工作流失败');
    }
}

/**
 * 删除工作流
 */
export async function deleteWorkflow(): Promise<void> {
    const settings = getSettings();
    const workflowName = settings.comfyWorkflowName;

    if (!workflowName) {
        toastr.error('请先选择一个工作流');
        return;
    }

    if (!confirm(`确定要删除工作流 "${workflowName}" 吗？`)) {
        return;
    }

    try {
        await deleteWorkflowFile(workflowName);
        toastr.success(`工作流 ${workflowName} 删除成功`);

        // 清除选择
        saveSetting('comfyWorkflowName', '');
        await updateWorkflowSelect();
    } catch (error) {
        console.error('Failed to delete workflow:', error);
        toastr.error('删除工作流失败');
    }
}
