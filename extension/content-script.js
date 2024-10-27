const channel_selector = "ytd-watch-metadata ytd-channel-name a"
const title_selector = "ytd-watch-metadata h1"
const button_selector = "#expanded-buttons yt-reaction-control-panel-button-view-model button"

const channel = parent.document.querySelector(channel_selector).textContent.trim()
const title = parent.document.querySelector(title_selector).textContent.trim()
const video = new URLSearchParams(parent.location.search).get("v") ?? parent.location.pathname.match(/\/live\/([-_A-Za-z0-9]{11})/)?.[1]

window.addEventListener("click", event => {
	const button = event.target.closest(button_selector)
	if (button) {
		// 💯を送信 みたいな文字が alt に入ってる
		// これでどのボタンか判定する
		const alt = button.querySelector("img").alt
		const reaction = alt.match(/^./u)[0]
		const ts = new Date().toJSON()
		chrome.storage.local.set({
			["T_" + ts]: {
				reaction,
				video,
				ts,
			},
			["V_" + video]: {
				channel,
				title,
			}
		})
	}
})
