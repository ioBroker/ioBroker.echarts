export default function getUrlQuery(): Record<string, string | boolean> {
    const parts: string[] = (window.location.search || '').replace(/^\?/, '').split('&');
    const query: Record<string, string | boolean> = {};
    parts.forEach(item => {
        const [name, val] = item.split('=');
        query[decodeURIComponent(name)] = val !== undefined ? decodeURIComponent(val) : true;
    });
    return query;
}
