import { html, css, LitElement } from "../lib/lit-all.min.js"
import ApexCharts from "../lib/apexcharts.esm.js"

export class DetailGraph extends LitElement {
	static properties = {
		value: {},
		aggregate_unit: {},
	}

	static styles = css`
		.container {
			height: 100%;
			display: flex;
			flex-flow: column;
			gap: 10px;
		}
		.options {
			flex: none;
			display: flex;
			justify-content: flex-end;
			align-items: center;
			gap: 10px;
			select {
				padding: 2px 4px;
			}
		}
		.chart-container {
			flex: 1;
			overflow: hidden;
		}
	`

	constructor() {
		super()
		this.value = null
		this.chart = null
		this.aggregate_unit = "second"
	}

	oninput(event) {
		this[event.target.name] = event.target.value
	}

	renderSelect(name, options, value) {
		return html`
			<select @input=${this.oninput} name=${name}>
				${options.map(option => {
					return html`
						<option value=${option.value} ?selected=${option.value === value}>
							${option.label}
						</option>
					`
				})}
			</select>
		`
	}

	render() {
		return html`
			<div class="container">
				<div class="options">
					集計単位:
					${this.renderSelect(
						"aggregate_unit",
						[
							{ value: "second", label: "秒" },
							{ value: "minute", label: "分" },
						],
						this.aggregate_unit
					)}
				</div>
				<div class="chart-container">
					<div id="chart"></div>
				</div>
			</div>
		`
	}

	firstUpdated() {
		const options = {
			chart: {
				width: "100%",
				height: "100%",
				type: "bar",
			},
			series: [],
			dataLabels: {
				enabled: false
			},
			tooltip: {
				x: {
					format: "yyyy/MM/dd HH:mm:ss"
				},
			},
			xaxis: {
				type: "datetime",
				labels: {
					datetimeUTC: false,
					datetimeFormatter: {
						year: "yyyy",
						month: "yyyy/MM",
						day: "yyyy/MM/dd",
						hour: "HH:mm",
						minute: "HH:mm:ss",
						second: "HH:mm:ss",
					},
				}
			},
			yaxis: {
				min: 0,
			},
		}

		this.chart = new ApexCharts(this.renderRoot.querySelector("#chart"), options)
		this.chart.render()
	}

	updated() {
		if (!this.value) {
			this.chart.updateOptions({
				series: [],
				title: { text: "" },
				subtitle: { text: "" },
			})
			return
		}

		const reactions = {}
		for (const { reaction, ts } of this.value.details) {
			if (!reactions[reaction]) {
				reactions[reaction] = new Map()
			}
			const reaction_obj = reactions[reaction]

			const date = new Date(ts)
			date.setMilliseconds(0)
			if (this.aggregate_unit === "minute") {
				date.setSeconds(0)
			}
			const ms = +date
			if (!reaction_obj[ms]) {
				reaction_obj[ms] = 0
			}
			reaction_obj[ms]++
		}
		const series = Object.entries(reactions).map(entry => {
			return {
				name: entry[0],
				data: Object.entries(entry[1]).map(([time, count]) => [+time, count]),
			}
		})

		this.chart.updateOptions({
			series,
			title: {
				text: this.value.title,
			},
			subtitle: {
				text: this.value.channel,
			}
		})
	}
}

customElements.define("detail-graph", DetailGraph)
