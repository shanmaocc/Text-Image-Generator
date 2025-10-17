/**
 * 工作流管理服务模块
 * 负责 ComfyUI 工作流的加载、保存、编辑和占位符替换
 */
import { Popup, POPUP_TYPE } from '@sillytavern/scripts/popup';
import type { ComfyWorkflow, WorkflowPlaceholder } from '../../@types';
import { getExtensionRoot } from '../../utils/dom-utils';
import {
    deleteWorkflowFile,
    loadWorkflowFile,
    loadWorkflowList,
    saveWorkflowFile,
} from './api-service';
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
 * @returns 自定义占位符数组
 */
function getCustomPlaceholders(): WorkflowPlaceholder[] {
    const raw = localStorage.getItem(CUSTOM_PH_STORAGE_KEY);
    try {
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/**
 * 保存自定义占位符
 * @param placeholders 占位符数组
 */
function saveCustomPlaceholders(placeholders: WorkflowPlaceholder[]): void {
    localStorage.setItem(CUSTOM_PH_STORAGE_KEY, JSON.stringify(placeholders));
}

/**
 * 更新工作流选择框
 * 从服务器加载工作流列表并填充到下拉框中
 */
export async function updateWorkflowSelect(): Promise<void> {
    try {
        const workflows = await loadWorkflowList();
        const $root = getExtensionRoot();
        const select = $root.find('#comfy-workflow-select');
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
        log.error('加载工作流列表失败:', error);
        const $root = getExtensionRoot();
        const select = $root.find('#comfy-workflow-select');
        select.empty();
        select.append('<option value="">-- 加载工作流失败 --</option>');
    }
}

/**
 * 获取当前选中的工作流
 * @returns 处理后的工作流 JSON 对象（已替换占位符），失败返回 null
 */
export async function getSelectedWorkflow(): Promise<ComfyWorkflow | null> {
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
 * @param workflow 原始工作流对象
 * @returns 替换后的工作流对象
 */
function replaceWorkflowPlaceholders(workflow: ComfyWorkflow): ComfyWorkflow {
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

    // 数值类型占位符 - 去掉引号，保持数字类型
    result = result.replace(/"%steps%"/g, String(settings.sd_steps || 20));
    result = result.replace(/"%scale%"/g, String(settings.sd_scale || 7));
    result = result.replace(/"%denoise%"/g, String(settings.sd_denoising_strength || 0.7));
    result = result.replace(/"%clip_skip%"/g, String(settings.sd_clip_skip || 1));
    result = result.replace(/"%width%"/g, String(settings.sd_width || 1024));
    result = result.replace(/"%height%"/g, String(settings.sd_height || 1024));

    // 处理种子 - 为每个节点生成不同的随机种子
    const generateRandomSeed = () => Math.round(Math.random() * Number.MAX_SAFE_INTEGER);

    if (settings.sd_seed >= 0) {
        // 如果用户指定了种子，使用用户种子
        result = result.replace(/"%seed%"/g, String(settings.sd_seed));
    } else {
        // 为每个节点生成不同的随机种子
        let seedCount = 0;
        result = result.replace(/"%seed%"/g, () => {
            seedCount++;
            return String(generateRandomSeed());
        });
    }

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
 * 快捷替换工作流中的占位符
 */
export function quickReplacePlaceholders(): void {
    const workflowText = $('#sd_comfy_workflow_editor_workflow').val()?.toString() || '';

    if (!workflowText.trim()) {
        toastr.warning('请先输入工作流内容');
        return;
    }

    try {
        const workflow = JSON.parse(workflowText);
        const replacedWorkflow = replaceValuesWithPlaceholders(workflow);
        const newWorkflowText = JSON.stringify(replacedWorkflow, null, 2);

        $('#sd_comfy_workflow_editor_workflow').val(newWorkflowText);

        // 触发占位符检查
        $('#sd_comfy_workflow_editor_workflow').trigger('input');

        toastr.success('快捷替换完成！');
    } catch (error) {
        console.error('快捷替换失败:', error);
        toastr.error('工作流格式错误，请检查JSON格式');
    }
}

/**
 * 递归替换工作流中的值为占位符
 */
function replaceValuesWithPlaceholders(obj: unknown, nodeId?: string): unknown {
    if (typeof obj === 'string') {
        return obj;
    }

    if (typeof obj === 'number') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => replaceValuesWithPlaceholders(item));
    }

    if (obj && typeof obj === 'object') {
        const result: any = {};

        for (const [key, value] of Object.entries(obj)) {
            if (key === 'class_type') {
                // 保留class_type不变
                result[key] = value;
            } else if (key === 'inputs' && typeof value === 'object') {
                // 处理inputs对象，传递节点信息
                const classType = (obj as any)['class_type'] || '';
                result[key] = replaceInputsWithPlaceholders(value as any, classType, nodeId);
            } else {
                result[key] = replaceValuesWithPlaceholders(value, key);
            }
        }

        return result;
    }

    return obj;
}

/**
 * 替换inputs中的值为占位符
 */
function replaceInputsWithPlaceholders(
    inputs: any,
    classType: string = '',
    nodeId: string = ''
): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    // 特殊节点类型：放大相关节点，这些节点应该保留特定参数的原始值
    const isUpscaleNode = [
        'PixelKSampleUpscalerProvider',
        'PixelKSampleUpscaler',
        'IterativeLatentUpscale',
        'IterativeImageUpscale',
        'UltimateSDUpscale',
        'ImageUpscaleWithModel',
    ].includes(classType);

    for (const [key, value] of Object.entries(inputs)) {
        // 如果值是数组，说明是关联节点，不应该被替换
        if (Array.isArray(value)) {
            result[key] = value;
            continue;
        }

        // 🔧 对于放大节点，保留采样器、调度器、去噪参数的原始值
        if (isUpscaleNode) {
            if (key === 'sampler_name' || key === 'sampler') {
                result[key] = value; // 保留原值（如 res_multistep）
                continue;
            }
            if (key === 'scheduler' || key === 'scheduler_name') {
                result[key] = value; // 保留原值（如 kl_optimal）
                continue;
            }
            if (key === 'denoise' || key === 'denoising_strength') {
                result[key] = value; // 保留原值（如 0.3）
                continue;
            }
        }

        // 去噪值应该使用用户界面设置的值，不需要特殊处理

        // 根据字段名判断应该替换为什么占位符
        if (key === 'text' && typeof value === 'string') {
            // 文本字段，检查是否包含提示词相关内容
            if (
                value.toLowerCase().includes('neg') ||
                value.toLowerCase().includes('negative') ||
                value.toLowerCase().includes('bad')
            ) {
                result[key] = '%negative_prompt%';
            } else if (
                value.toLowerCase().includes('pos') ||
                value.toLowerCase().includes('positive') ||
                value.toLowerCase().includes('best')
            ) {
                result[key] = '%prompt%';
            } else {
                result[key] = '%prompt%';
            }
        } else if (key === 'positive' && typeof value === 'string') {
            // 有些节点可能直接在 inputs 中提供字符串形式的 positive/negative
            result[key] = '%prompt%';
        } else if (key === 'negative' && typeof value === 'string') {
            result[key] = '%negative_prompt%';
        } else if (key === 'ckpt_name' || key === 'model_name' || key === 'model') {
            result[key] = '%model%';
        } else if (key === 'vae_name' || key === 'vae') {
            result[key] = '%vae%';
        } else if (key === 'sampler_name' || key === 'sampler') {
            result[key] = '%sampler%';
        } else if (key === 'scheduler' || key === 'scheduler_name') {
            result[key] = '%scheduler%';
        } else if (key === 'steps') {
            result[key] = '%steps%';
        } else if (key === 'cfg' || key === 'cfg_scale') {
            result[key] = '%scale%';
        } else if (key === 'denoise' || key === 'denoising_strength') {
            result[key] = '%denoise%';
        } else if (key === 'clip_skip') {
            result[key] = '%clip_skip%';
        } else if (key === 'width') {
            result[key] = '%width%';
        } else if (key === 'height') {
            result[key] = '%height%';
        } else if (key === 'seed') {
            result[key] = '%seed%';
        } else if (key === 'user_avatar' || key === 'user_image') {
            result[key] = '%user_avatar%';
        } else if (key === 'char_avatar' || key === 'char_image') {
            result[key] = '%char_avatar%';
        } else {
            // 其他字段保持原值
            result[key] = value;
        }
    }

    return result;
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
        const editorHtml = $(
            await $.get(
                'scripts/extensions/third-party/Text-Image-Generator/comfyWorkflowEditor.html'
            )
        );

        const saveValue = (_popup: any) => {
            workflow = $('#sd_comfy_workflow_editor_workflow').val()?.toString() || '';
            return true;
        };

        const popup = new Popup(editorHtml, POPUP_TYPE.CONFIRM, '', {
            okButton: '保存',
            cancelButton: '取消',
            wide: true,
            large: true,
            onClosing: saveValue,
        });

        const popupResult = popup.show();
        let workflow = workflowContent;

        const checkPlaceholders = () => {
            workflow = $('#sd_comfy_workflow_editor_workflow').val()?.toString() || '';
            $('.sd_comfy_workflow_editor_placeholder_list > li[data-placeholder]').each(
                function () {
                    const key = this.getAttribute('data-placeholder');
                    const found = workflow.search(`"%${key}%"`) !== -1;
                    this.classList[found ? 'remove' : 'add']('sd_comfy_workflow_editor_not_found');
                }
            );
        };

        $('#sd_comfy_workflow_editor_name').text(workflowName);
        $('#sd_comfy_workflow_editor_workflow').val(workflow);

        const addPlaceholderDom = (placeholder: { find: string; replace: string }) => {
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

        // 快捷替换按钮事件
        $('#sd_comfy_workflow_editor_quick_replace').on('click', function () {
            quickReplacePlaceholders();
        });

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

        // 自动打开工作流编辑器
        await openWorkflowEditor();
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
