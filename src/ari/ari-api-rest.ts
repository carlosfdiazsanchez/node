const config = {
  baseUrl: 'https://asterisk.ridinn.com/ari/events',
  user: 'node',
  pass: 'ari_password',
  appName: 'node',
};

export async function answerChannel(channelId: string): Promise<void> {
	const url = `${config.baseUrl}/channels/${channelId}/answer`;
	await fetch(url, {
		method: 'POST',
		headers: {
			'Authorization': 'Basic ' + Buffer.from(`${config.user}:${config.pass}`).toString('base64'),
			'Content-Type': 'application/json',
		},
	});
}

export async function hangupChannel(channelId: string): Promise<void> {
	const url = `${config.baseUrl}/channels/${channelId}`;
	await fetch(url, {
		method: 'DELETE',
		headers: {
			'Authorization': 'Basic ' + Buffer.from(`${config.user}:${config.pass}`).toString('base64'),
			'Content-Type': 'application/json',
		},
	});
}

export async function playAudioOnChannel(channelId: string, media: string): Promise<void> {
	const url = `${config.baseUrl}/channels/${channelId}/play`;
	await fetch(url, {
		method: 'POST',
		headers: {
			'Authorization': 'Basic ' + Buffer.from(`${config.user}:${config.pass}`).toString('base64'),
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ media ,lang: 'es' }),
	});
}

export async function createBridge(): Promise<string> {
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

export async function addChannelsToBridge(bridgeId: string, channelIds: string[]): Promise<void> {
	const url = `${config.baseUrl}/bridges/${bridgeId}/addChannel?channel=${channelIds.join(',')}`;
	await fetch(url, {
		method: 'POST',
		headers: {
			'Authorization': 'Basic ' + Buffer.from(`${config.user}:${config.pass}`).toString('base64'),
			'Content-Type': 'application/json',
		},
	});
}
