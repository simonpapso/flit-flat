export function serviceUrl(value) {
  if(typeof value!=='string'||value.length>2048)return '';
  const text=value.trim();
  if(!/^https?:\/\//i.test(text))return '';
  try {
    const url=new URL(text);
    return url.hostname&&!url.username&&!url.password?url.href:'';
  } catch { return ''; }
}
