// ==UserScript==
// @name              OpenCD签到
// @namespace         
// @version           0.0.1
// @author            
// @loginURL          https://open.cd/
// @updateURL         
// @expire            900000
// @grant             cookie
// @domain            open.cd
// @domain            2045.site
// @domain            uimstest.2045.site
// @domain            uimstest.2045.site:5001
// ==/UserScript==

const opts = { headers: { referer: "https://open.cd/" } };
exports.run = async function (param) {
	// 使用浏览器打开登录界面，并获取窗口句柄
	return await open("https://open.cd/", /** 调试时设置成true */ false, async (fb) => {
		var rate = 0.5; // 间隔时间倍率,值越小脚本执行越快
		await fb.sleep(1800 * rate)
		let signInResult = await fb.eval(checkResult);
		if (signInResult.includes("已签到") || signInResult.includes("签到记录")) {
			return "签到成功";
		}
		if (!await fb.click("#info_block > tbody > tr > td > table > tbody > tr > td:nth-child(3) > div:nth-child(2) > a:nth-child(1)")) throw '签到失败'
		await fb.sleep(1600 * rate)
		var imgSrc = await fb.eval(getImgSrc);
		if (imgSrc == null) {
			var tryCount = 0;
			while (tryCount < 3) {
				tryCount++;
				await fb.sleep(500 * rate)
				imgSrc = await fb.eval(getImgSrc);
				if (imgSrc != null) {
					break;
				}
			}
		}
		if (imgSrc == null) {
			throw "获取验证码失败";
		}
		var file = await imageUrlToFile(imgSrc, 'temp');
		var reqResult = await uploadFileInfo(file);
		if (reqResult.result && reqResult.result.length == 6) {
			var jsCode = "document.getElementById(\"i_signin\").contentWindow.document.querySelector('#imagestring').value = \"" + reqResult.result + "\"";
			fb.eval(jsCode)
			await fb.sleep(1500 * rate)
			jsCode = "document.getElementById(\"i_signin\").contentWindow.document.querySelector('#ok').click()";
			fb.eval(jsCode)
			await fb.sleep(1500 * rate)
			let signInResult = await fb.eval(checkResult);
			if (signInResult.includes("已签到") || signInResult.includes("签到记录")) {
				return "签到成功";
			}
			throw result;
		}
		throw reqResult;
	});
};

function getImgSrc() {
	var img = document.getElementById("i_signin").contentWindow.document.querySelector('#frmSignin > table > tbody > tr > td > img');
	if (img == null) {
		return null;
	}
	return img.src;
}

function checkResult() {
	let element = document.querySelector("#info_block > tbody > tr > td > table > tbody > tr > td:nth-child(3) > div:nth-child(2) > a:nth-child(1)");
	return element.textContent
}

async function imageUrlToFile(url, fileName) {
	try {
		const response = await axios.get(url, { responseType: 'arraybuffer' })
		const imageData = response.data
		const blob = new Blob([imageData], {
			type: response.headers['content-type']
		})
		const file = new File([blob], fileName, { type: blob.type })
		return file
	} catch (error) {
		console.error('将图片转换为File对象时发生错误:', error)
		throw error
	}
}

async function uploadFileInfo(file) {
	let formData = new FormData();
	formData.append("image", file);
	// 这里是使用ddddocr部署的OCR识别（https://github.com/sml2h3/ddddocr）
	let ocrUrl = 'http://uimstest.2045.site:5001/ocr'
	var { data } = await axios.post(ocrUrl, formData)
	return data
}


exports.check = async function (param) {
	// 使用浏览器打开登录界面，并获取窗口句柄
	return await open("https://open.cd/", /** 调试时设置成true */ false, async (fb) => {
		var rate = 0.5; // 间隔时间倍率,值越小脚本执行越快
		await fb.sleep(1800 * rate)
		let signInResult = await fb.eval(checkResult);
		return signInResult != null
	});
};
