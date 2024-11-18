const data = {}

const default_reaction_types = ["❤", "😄", "🎉", "😳", "💯"]

const load = async () => {
	const keys = await chrome.storage.local.getKeys()
	const values = await chrome.storage.local.get(keys)

	const reaction_types = new Set(default_reaction_types)
	const reactions = []
	const videos = {}

	for (const [key, value] of Object.entries(values)) {
		if (key.startsWith("T_")) {
			reactions.push(value)
			reaction_types.add(value.reaction)
		} else if (key.startsWith("V_")) {
			videos[key.slice(2)] = value
		}
	}

	data.reaction_types = reaction_types
	data.reactions = reactions
	data.videos = videos
	console.log({ loaded: data })
}

export const aggregate = (from, to) => {
	const reactions = data.reactions.filter(r => {
		const ts = new Date(r.ts)
		if (from && ts < from) {
			return false
		}
		if (to && to <= ts) {
			return false
		}
		return true
	})

	const rows = []

	for (const [video, group] of Map.groupBy(reactions, r => r.video)) {
		const row = {
			video,
			...data.videos[video],
			last_reaction: group.map(r => +new Date(r.ts)).sort((a, b) => b - a)[0],
			...Object.fromEntries(data.reaction_types.values().map(r => [r, 0]))
		}
		for (const [reaction, subgroup] of Map.groupBy(group, r => r.reaction)) {
			row[reaction] = subgroup.length
		}
		rows.push(row)
	}

	return {
		rows: rows.sort((a, b) => b.last_reaction - a.last_reaction),
		reaction_types: data.reaction_types.values().toArray(),
	}
}

export const getVideo = (video) => {
	return {
		...data.videos[video],
		details: data.reactions.filter(r => r.video === video),
	}
}

export const clear = async () => {
	await chrome.storage.local.clear()
	data.reactions = []
	data.videos = {}
}

await load()
