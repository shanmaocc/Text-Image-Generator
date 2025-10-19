/**
 * Cursor 绑卡页面获取工具 - 完整浏览器控制台版本
 * 使用方法：复制代码到浏览器控制台执行
 */

// 主函数：获取绑卡页面URL
async function getCheckoutUrl() {
    console.log('💳 开始获取Cursor绑卡页面URL...');

    // 检查当前页面
    if (!window.location.hostname.includes('cursor.com')) {
        console.warn('⚠️ 警告: 当前不在cursor.com域名下');
        console.log('💡 建议: 请访问 https://cursor.com 并登录');
    }

    try {
        const response = await fetch('https://cursor.com/api/checkout', {
            method: 'POST',
            headers: {
                Accept: '*/*',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'Accept-Language': 'zh-CN,zh;q=0.9',
                'Content-Type': 'application/json',
                Origin: 'https://cursor.com',
                Priority: 'u=1, i',
                Referer: 'https://cursor.com/dashboard',
                'Sec-Ch-Ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
                'Sec-Ch-Ua-Arch': '"x86"',
                'Sec-Ch-Ua-Bitness': '"64"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Ch-Ua-Platform-Version': '"10.0.0"',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'User-Agent': navigator.userAgent,
            },
            body: JSON.stringify({
                allowAutomaticPayment: true,
                allowTrial: true,
                tier: 'ultra',
            }),
            credentials: 'include',
        });

        console.log('🔍 响应状态:', response.status);

        if (response.ok) {
            const checkoutUrl = await response.json();
            console.log('✅ 绑卡页面请求成功!');
            console.log('🔗 绑卡页面URL:', checkoutUrl);

            if (checkoutUrl.includes('checkout.stripe.com')) {
                console.log('✅ 检测到Stripe支付页面');

                // 显示结果并询问是否打开
                const message = `🎉 成功获取绑卡页面URL！\n\nURL: ${checkoutUrl}\n\n是否要打开这个页面？`;
                if (confirm(message)) {
                    window.open(checkoutUrl, '_blank');
                    console.log('🚀 已打开绑卡页面');
                }

                return checkoutUrl;
            } else {
                console.warn('⚠️ 返回的URL不是预期的Stripe支付页面');
                console.log('🔗 实际URL:', checkoutUrl);
                return checkoutUrl;
            }
        } else {
            const errorText = await response.text();
            console.error('❌ 绑卡页面请求失败:', response.status);
            console.error('📄 错误响应:', errorText.substring(0, 200) + '...');
            return null;
        }
    } catch (error) {
        console.error('❌ 请求异常:', error.message);
        return null;
    }
}

// 快速获取函数
async function quickGet() {
    console.log('🚀 快速获取Cursor绑卡页面URL');
    console.log('=' * 40);

    const url = await getCheckoutUrl();

    if (url) {
        console.log('🎉 获取成功!');
        return url;
    } else {
        console.log('❌ 获取失败');
        return null;
    }
}

// 显示帮助信息
function showHelp() {
    console.log('📖 Cursor 绑卡页面获取工具 - 使用帮助');
    console.log('=' * 50);
    console.log('');
    console.log('🔧 使用步骤:');
    console.log('1. 访问 https://cursor.com 并登录');
    console.log('2. 按 F12 打开开发者工具');
    console.log('3. 切换到 Console 标签');
    console.log('4. 复制并粘贴此脚本');
    console.log('5. 按回车执行');
    console.log('');
    console.log('📋 可用命令:');
    console.log('• getCheckoutUrl() - 获取绑卡页面URL（详细日志）');
    console.log('• quickGet() - 快速获取绑卡页面URL');
    console.log('• showHelp() - 显示帮助信息');
    console.log('');
    console.log('⚠️ 注意事项:');
    console.log('• 请确保已登录Cursor账户');
    console.log('• 建议在cursor.com域名下使用');
    console.log('• 如果失败，请检查网络连接和登录状态');
}

// 自动执行
console.log('🎯 Cursor 绑卡页面获取工具已加载');
console.log('💡 输入 getCheckoutUrl() 开始获取');
console.log('💡 输入 showHelp() 查看帮助');

// 自动执行快速获取
quickGet();
