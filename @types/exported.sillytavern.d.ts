
/**
 * 酒馆提供给插件的稳定接口, 具体内容见于 SillyTavern/public/scripts/st-context.js 或 https://github.com/SillyTavern/SillyTavern/blob/release/public/scripts/st-context.js
 * 你也可以在酒馆页面按 f12, 在控制台中输入 `window.SillyTavern.getContext()` 来查看当前酒馆所提供的接口
 */


declare const SillyTavern: {

  readonly getRequestHeaders: () => {
    'Content-Type': string;
    'X-CSRF-TOKEN': string;
  };

};
