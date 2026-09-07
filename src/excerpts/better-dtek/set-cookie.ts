// https://github.com/alex-popov-tech/better-dtek/blob/7e0aacc5306939116ada7fa79416b7f32a186cf7/src/lib/server/dtek/client.ts#L115-L129
/**
 * Helper to extract Set-Cookie headers from Response
 * Node 20+ has headers.getSetCookie(), fallback for older versions
 */
function getSetCookieHeaders(headers: Headers): string[] {
	// Node 20+ has getSetCookie() method on Headers
	const headersWithGetSetCookie = headers as Headers & {
		getSetCookie?: () => string[];
	};
	if (typeof headersWithGetSetCookie.getSetCookie === 'function') {
		return headersWithGetSetCookie.getSetCookie();
	}
	const sc = headers.get('set-cookie');
	return sc ? [sc] : [];
}
