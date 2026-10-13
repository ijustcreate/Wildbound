const $ = id => document.getElementById(id);
let online = false;
function formatUptime(seconds) {
  if (!Number.isFinite(seconds)) return '—';
  const s = Math.max(0,Math.floor(seconds));
  return `${Math.floor(s/86400)}d ${Math.floor(s%86400/3600)}h ${Math.floor(s%3600/60)}m`;
}
function setOnline(value, message) {
  online = value;
  $('state').textContent = value ? 'Online' : 'Offline';
  $('state').dataset.online = String(value);
  $('notice').textContent = message;
  for (const id of ['save','stop','send']) $(id).disabled = !value;
}
async function refresh() {
  try {
    const data = await window.serverControl.request('status',$('token').value);
    const publicHealthy = data.publicHealth === true;
    setOnline(true,publicHealthy ? 'Public multiplayer is online.' : 'Dedicated server responded; public connection is not verified.');
    $('state').textContent = publicHealthy ? 'Active · public' : 'Local only';
    $('authority-count').textContent = String(data.authorityCount ?? 1);
    $('tunnel-count').textContent = data.tunnelCount == null ? '—' : String(data.tunnelCount);
    $('local-health').textContent = data.localHealth === false ? 'OFFLINE' : 'OK';
    $('public-health').textContent = publicHealthy ? 'OK' : data.publicHealth === false ? 'OFFLINE' : 'UNVERIFIED';
    $('checked').textContent = `Checked ${new Date().toLocaleTimeString()}`;
    $('public-address').value = data.publicAddress || '';
    $('copy-address').disabled = !data.publicAddress;
    $('uptime').textContent = formatUptime(data.uptimeSeconds);
    $('players').textContent = String(data.playerCount ?? data.players?.length ?? 0);
    $('seed').textContent = data.worldSeed == null ? '—' : String(data.worldSeed);
    $('saved').textContent = data.lastSave ? new Date(data.lastSave).toLocaleString() : '—';
    $('player-list').replaceChildren();
    const players = Array.isArray(data.players) ? data.players : [];
    for (const p of players) {
      const li = document.createElement('li');
      li.textContent = typeof p === 'string' ? p : `${p.name || 'Explorer'}${p.location ? ' · '+p.location : ''}`;
      $('player-list').append(li);
    }
    if (!players.length) $('player-list').append(Object.assign(document.createElement('li'),{textContent:'No connected players.'}));
  } catch (error) {
    const detail = error.message || '';
    setOnline(false,/ECONNREFUSED/.test(detail) ? 'Dedicated forest server is not running on this PC.' : detail || 'Dedicated server unavailable.');
    for (const id of ['authority-count','tunnel-count','local-health','public-health']) $(id).textContent = '—';
    $('checked').textContent = `Checked ${new Date().toLocaleTimeString()}`;
    $('public-address').value = '';
    $('copy-address').disabled = true;
    for (const id of ['uptime','players','seed','saved']) $(id).textContent = '—';
    $('player-list').replaceChildren(Object.assign(document.createElement('li'),{textContent:'Server offline or status unavailable.'}));
  }
}
async function action(name, payload) {
  try {
    const result = await window.serverControl.request(name,$('token').value,payload);
    $('notice').textContent = result.message || `${name} requested.`;
    if (name === 'announce') $('announcement').value = '';
    await refresh();
  } catch (error) { $('notice').textContent = error.message || 'Server command failed.'; }
}
$('refresh').onclick = refresh;
$('copy-address').onclick = async () => {
  try { await navigator.clipboard.writeText($('public-address').value); $('notice').textContent = 'Public address copied.'; }
  catch { $('public-address').select(); $('notice').textContent = 'Select the address and copy it manually.'; }
};
$('save').onclick = () => action('save');
$('stop').onclick = () => {
  if (window.confirm('Save the world and stop the persistent server?')) action('stop');
};
$('send').onclick = () => action('announce',{message:$('announcement').value});
setInterval(refresh,5000);
refresh();
