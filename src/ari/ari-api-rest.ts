export interface AriConfig {
	baseUrl: string;
	user: string;
	pass: string;
}

export async function answerChannel(config: AriConfig, channelId: string): Promise<void> {
	const url = `${config.baseUrl}/channels/${channelId}/answer`;
	await fetch(url, {
		method: 'POST',
		headers: {
			'Authorization': 'Basic ' + Buffer.from(`${config.user}:${config.pass}`).toString('base64'),
			'Content-Type': 'application/json',
		},
	});
}

export async function hangupChannel(config: AriConfig, channelId: string): Promise<void> {
	const url = `${config.baseUrl}/channels/${channelId}`;
	await fetch(url, {
		method: 'DELETE',
		headers: {
			'Authorization': 'Basic ' + Buffer.from(`${config.user}:${config.pass}`).toString('base64'),
			'Content-Type': 'application/json',
		},
	});
}

export async function playAudioOnChannel(config: AriConfig, channelId: string, media: string): Promise<void> {
	const url = `${config.baseUrl}/channels/${channelId}/play`;
	await fetch(url, {
		method: 'POST',
		headers: {
			'Authorization': 'Basic ' + Buffer.from(`${config.user}:${config.pass}`).toString('base64'),
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ media }),
	});
}

export async function createBridge(config: AriConfig): Promise<string> {
	const url = `${config.baseUrl}/bridges`;
	const resp = await fetch(url, {
		method: 'POST',
		headers: {
			'Authorization': 'Basic ' + Buffer.from(`${config.user}:${config.pass}`).toString('base64'),
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ type: 'mixing' }),
	});
	if (!resp.ok) throw new Error('No se pudo crear el bridge');
	const location = resp.headers.get('Location');
	if (location) {
		const parts = location.split('/');
		return parts[parts.length - 1];
	}
	const data = await resp.json();
	if (data && data.id) return data.id;
	throw new Error('No se pudo obtener el id del bridge');
}

export async function addChannelsToBridge(config: AriConfig, bridgeId: string, channelIds: string[]): Promise<void> {
	const url = `${config.baseUrl}/bridges/${bridgeId}/addChannel?channel=${channelIds.join(',')}`;
	await fetch(url, {
		method: 'POST',
		headers: {
			'Authorization': 'Basic ' + Buffer.from(`${config.user}:${config.pass}`).toString('base64'),
			'Content-Type': 'application/json',
		},
	});
}
