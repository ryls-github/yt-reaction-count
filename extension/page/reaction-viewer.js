import { html, css, LitElement, live } from "./lit-all.min.js"
import { reaction_types, aggregate, clear, getVideo } from "./data.js"
import "./detail-graph.js"

export class ReactionViewer extends LitElement {
	static properties = {
		editing_start: {},
		editing_end: {},
		items: {},
		details: {},
	}

	static styles = css`
		* {
			box-sizing: border-box;
		}
		.filter {
			display: flex;
			align-items: center;
			gap: 10px;
			border-bottom: 1px solid #ccc;
			padding: 10px;
			margin: 10px;
			input {
				padding: 4px 8px;
			}
			.daterange {
				display: flex;
				gap: 10px;
				align-items: center;
			}
		}
		.vhr {
			margin: 0 10px;
			border: 0;
			width: 1px;
			align-self: stretch;
			background-color: #ccc;
		}
		h1 {
			font-size: 18px;
		}
		table {
			table-layout: fixed;
			width: 100%;
			border-collapse: collapse;
			th, td {
				padding: 2px 8px;
				border: 1px solid #e0e0e0;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
			th {
				background: #e1e5e5;
			}
			.video {
				width: 100px;
				max-width: 140px;
			}
			.channel {
				width: 200px;
			}
			.title {
				width: 320px;
			}
			.last_reaction {
				width: 160px;
			}
			.reaction {
				width: 40px;
				text-align: center;
			}
			tr:hover {
				background-color: #f0f5f5;
			}
		}
		dialog {
			width: 80%;
			height: 80%;
			padding: 0;
			border: 1px solid #0008;
			outline: none;
			.dialog-content {
				padding: 20px;
				height: 100%;
			}
			&::backdrop {
				background-color: #0006;
			}
		}
		detail-graph {
			display: block;
			height: 100%;
		}
	`

	constructor() {
		super()
		this.editing_start = ""
		this.editing_end = ""
		this.start = ""
		this.end = ""
		this.items = aggregate(null, null)
		this.details = null
	}

	oninput(event) {
		this[event.target.name] = event.target.value
	}

	onclickRow(event) {
		const video = event.target.closest("tr").querySelector("td").textContent.trim()
		const details = getVideo(video)
		this.details = details
	}

	onclickDialog(event) {
		if (event.target === event.currentTarget) {
			event.target.close()
		}
	}

	onclose() {
		this.details = null
	}

	filter() {
		this.start = this.editing_start
		this.end = this.editing_end
		this.items = aggregate(
			this.start === "" ? null : new Date(this.start),
			this.end === "" ? null : new Date(this.end)
		)
	}

	async clear() {
		if (confirm("すべてのデータをクリアしますか？")) {
			await clear()
			this.items = []
		}
	}

	render() {
		const formatDateStr = (s) => s.replaceAll("T", " ").replaceAll("-", "/")
		const formatDateMs = (ms) => {
			const d = new Date(ms)
			return d.getFullYear() + "/" +
				String(d.getMonth() + 1).padStart(2, "0") + "/" +
				String(d.getDate()).padStart(2, "0") + " " +
				String(d.getHours()).padStart(2, "0") + ":" +
				String(d.getMinutes()).padStart(2, "0") + ":" +
				String(d.getSeconds()).padStart(2, "0") + "." +
				String(d.getMilliseconds()).padStart(3, "0")
		}
		const title = this.start || this.end
			? `${formatDateStr(this.start)} ～ ${formatDateStr(this.end)}`
			: "全期間"

		return html`
			<div class="filter">
				<div class="daterange">
					フィルタ
					<input type="datetime-local" name="editing_start" .value=${live(this.editing_start)} @input=${this.oninput}>
					～
					<input type="datetime-local" name="editing_end" .value=${live(this.editing_end)} @input=${this.oninput}>
				</div>
				<button @click=${this.filter}>確定</button>
				<hr class="vhr"/>
				<button @click=${this.clear}>クリア</button>
			</div>
			<div class="result">
				<h1 class="result-title">${title}</h1>
				<table>
					<thead>
						<tr>
							<th class="video">Video ID</th>
							<th class="channel">チャンネル</th>
							<th class="title">タイトル</th>
							<th class="last_reaction">最終リアクション</th>
							${reaction_types.map(r => html`<th class="reaction">${r}</th>`)}
						</tr>
					</thead>
					<tbody @click=${this.onclickRow}>
						${this.items.map(item => {
							return html`
								<tr>
									<td>${item.video}</td>
									<td title=${item.channel}>${item.channel}</td>
									<td title=${item.title}>${item.title}</td>
									<td>${formatDateMs(item.last_reaction)}</td>
									${reaction_types.map(r => html`<td class="reaction">${item[r]}</td>`)}
								</tr>
							`
						})}
					</tbody>
				</table>
			</div>
			<dialog @close=${this.onclose} @click=${this.onclickDialog}>
				<div class="dialog-content">
					<detail-graph .value=${this.details}></detail-graph>
				</div>
			</dialog>
		`
	}

	updated() {
		const dialog = this.renderRoot.querySelector("dialog")
		const should_open = !!this.details
		if (should_open && !dialog.open) {
			dialog.showModal()
		} else if (!should_open && dialog.open) {
			dialog.close()
		}
	}
}

customElements.define("reaction-viewer", ReactionViewer)
