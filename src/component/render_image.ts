// 重新导出拆分后的模块，保持向后兼容

export {
    handleChatLoaded,
    handleGenerateImageButtonClick,
    handlePartialRender,
    partialRenderEvents,
} from './image/event-handlers';

export {
    syncGenerateButtonStateForMessage,
} from './image/button-manager';
