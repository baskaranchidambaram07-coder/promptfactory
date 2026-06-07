import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../api/adminApi';
import s from './Admin.module.css';

const COLS = [
  { key: 'PromptId',    label: 'ID',         sortable: true,  width: 60  },
  { key: 'Categories',  label: 'Category',   sortable: true               },
  { key: 'FromURL',     label: 'Before (FromURL)', sortable: true          },
  { key: 'ToURL',       label: 'After (ToURL)',    sortable: true          },
  { key: '_status',     label: 'Status',     sortable: true               },
  { key: '_actions',    label: 'Actions',    sortable: false              },
];

// Derive a sortable status string for the _status virtual column
function statusOf(item) {
  if (item.FromURL && item.ToURL) return 'complete';
  if (item.FromURL || item.ToURL) return 'partial';
  return 'missing';
}

function SortIcon({ col, sortCol, sortDir }) {
  if (!col.sortable) return null;
  const active = sortCol === col.key;
  const arrow = active ? (sortDir === 'asc' ? '↑' : '↓') : '↕';
  return <span className={`${s.sortIcon} ${active ? s.thActive : ''}`}>{arrow}</span>;
}

export default function Images() {
  const [items, setItems]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [editing, setEditing] = useState(null);
  const [imgForm, setImgForm] = useState({ FromURL: '', ToURL: '' });
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState(null);

  // Sorting — default: PromptId ascending
  const [sortCol, setSortCol] = useState('PromptId');
  const [sortDir, setSortDir] = useState('asc');

  const LIMIT = 30;

  const load = useCallback((p = page) => {
    setLoading(true);
    const params = new URLSearchParams({ page: p, limit: LIMIT });
    if (search) params.set('search', search);
    api.get(`/admin/collection?${params}`)
      .then((r) => { setItems(r.data.data || []); setTotal(r.data.total || 0); })
      .catch(() => flash('error', 'Failed to load'))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  // Client-side sort
  const sorted = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      let av, bv;

      if (sortCol === '_status') {
        // complete < partial < missing  (alphabetically asc = complete first)
        const order = { complete: 0, partial: 1, missing: 2 };
        av = order[statusOf(a)];
        bv = order[statusOf(b)];
        return sortDir === 'asc' ? av - bv : bv - av;
      }

      if (sortCol === 'PromptId') {
        av = Number(a.PromptId) || 0;
        bv = Number(b.PromptId) || 0;
        return sortDir === 'asc' ? av - bv : bv - av;
      }

      av = String(a[sortCol] ?? '').toLowerCase();
      bv = String(b[sortCol] ?? '').toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [items, sortCol, sortDir]);

  const handleSort = (col) => {
    if (!col.sortable) return;
    if (sortCol === col.key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col.key);
      setSortDir('asc');
    }
  };

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const openEdit = (item) => {
    setEditing(item);
    setImgForm({ FromURL: item.FromURL || '', ToURL: item.ToURL || '' });
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/collection/${editing.PromptId}/images`, imgForm);
      flash('success', `Images updated for Prompt #${editing.PromptId}`);
      setEditing(null);
      load();
    } catch (err) {
      flash('error', err.response?.data?.error || 'Update failed');
    }
    setSaving(false);
  };

  const clearImage = async (id, field) => {
    try {
      await api.patch(`/admin/collection/${id}/images`, { [field]: null });
      flash('success', `${field} cleared`);
      load();
    } catch { flash('error', 'Failed to clear image'); }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className={s.pageHeader}>
        <div>
          <div className={s.pageTitle}>Image Management</div>
          <div className={s.pageSub}>Manage Before (FromURL) and After (ToURL) images for each prompt</div>
        </div>
      </div>

      {msg && <div className={msg.type === 'success' ? s.alertSuccess : s.alertError}>{msg.text}</div>}

      {/* Search */}
      <div className={s.panel}>
        <div className={s.panelHeader}><div className={s.panelTitle}>Filter Prompts</div></div>
        <div style={{ padding: '14px 20px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input className={s.searchInput} placeholder="Search by category or description…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className={s.btnGhost} onClick={() => { setPage(1); load(1); }}>Search</button>
          <button className={s.btnGhost} onClick={() => { setSearch(''); setPage(1); }}>Clear</button>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--pf-text-3)' }}>{total} prompts</span>
        </div>
      </div>

      {/* Edit panel */}
      {editing && (
        <div className={s.panel}>
          <div className={s.panelHeader}>
            <div className={s.panelTitle}>Edit Images — Prompt #{editing.PromptId} · {editing.Categories}</div>
            <button className={s.btnGhost} onClick={() => setEditing(null)}>✕ Cancel</button>
          </div>
          <div className={s.formGrid}>
            <div className={s.field}>
              <label className={s.label}>Before Image URL (FromURL)</label>
              <input className={s.input} placeholder="https://…" value={imgForm.FromURL}
                onChange={(e) => setImgForm((f) => ({ ...f, FromURL: e.target.value }))} />
              {imgForm.FromURL && (
                <img src={imgForm.FromURL} alt="from preview"
                  style={{ marginTop:8, width:120, height:120, objectFit:'cover', borderRadius:8, border:'1px solid var(--pf-border)' }}
                  onError={(e) => e.target.style.display = 'none'} />
              )}
            </div>
            <div className={s.field}>
              <label className={s.label}>After Image URL (ToURL)</label>
              <input className={s.input} placeholder="https://…" value={imgForm.ToURL}
                onChange={(e) => setImgForm((f) => ({ ...f, ToURL: e.target.value }))} />
              {imgForm.ToURL && (
                <img src={imgForm.ToURL} alt="to preview"
                  style={{ marginTop:8, width:120, height:120, objectFit:'cover', borderRadius:8, border:'1px solid var(--pf-border)' }}
                  onError={(e) => e.target.style.display = 'none'} />
              )}
            </div>
          </div>
          <div style={{ padding:'0 20px 8px', fontSize:12, color:'var(--pf-text-3)' }}>
            These images display as the Before → After slider on the home page and prompt detail page.
          </div>
          <div className={s.formFooter}>
            <button className={s.btnPrimary} onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Update Images'}
            </button>
            <button className={s.btnGhost} onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={s.panel}>
        <div className={s.tableWrap}>
          {loading ? (
            <div className={s.loading}>Loading…</div>
          ) : items.length === 0 ? (
            <div className={s.empty}><div className={s.emptyIcon}>🖼️</div>No prompts found</div>
          ) : (
            <table className={s.table}>
              <thead>
                <tr>
                  {COLS.map((col) => (
                    <th
                      key={col.key}
                      style={{ width: col.width }}
                      className={[
                        col.sortable ? s.thSortable : '',
                        col.sortable && sortCol === col.key ? s.thActive : '',
                      ].join(' ')}
                      onClick={() => handleSort(col)}
                    >
                      <span className={s.thInner}>
                        {col.label}
                        <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((item) => (
                  <tr key={item.PromptId}>
                    <td className={s.tdMono}>#{item.PromptId}</td>
                    <td><span className={s.pill}>{item.Categories || '—'}</span></td>
                    <td>
                      {item.FromURL ? (
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <img src={item.FromURL} alt="from" className={s.imgThumb} onError={(e) => e.target.style.display = 'none'} />
                          <span style={{ fontSize:11, color:'var(--pf-text-3)', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.FromURL}</span>
                        </div>
                      ) : <span style={{ fontSize:12, color:'var(--pf-text-3)' }}>— not set —</span>}
                    </td>
                    <td>
                      {item.ToURL ? (
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <img src={item.ToURL} alt="to" className={s.imgThumb} onError={(e) => e.target.style.display = 'none'} />
                          <span style={{ fontSize:11, color:'var(--pf-text-3)', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.ToURL}</span>
                        </div>
                      ) : <span style={{ fontSize:12, color:'var(--pf-text-3)' }}>— not set —</span>}
                    </td>
                    <td>
                      {item.FromURL && item.ToURL
                        ? <span className={s.pillGreen}>✓ Complete</span>
                        : item.FromURL || item.ToURL
                          ? <span className={s.pillAmber}>⚠ Partial</span>
                          : <span className={s.pillRed}>✕ Missing</span>
                      }
                    </td>
                    <td>
                      <div className={s.actions}>
                        <button className={s.btnSm} onClick={() => openEdit(item)}>Edit Images</button>
                        {item.FromURL && <button className={s.btnDanger} onClick={() => clearImage(item.PromptId, 'FromURL')}>Clear Before</button>}
                        {item.ToURL  && <button className={s.btnDanger} onClick={() => clearImage(item.PromptId, 'ToURL')}>Clear After</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination + sort indicator */}
        <div className={s.pagination}>
          <span style={{ fontSize: 12, color: 'var(--pf-text-3)' }}>
            Page {page} of {totalPages || 1} · {total} prompts
            {' '}· sorted by <strong style={{ color: 'var(--pf-text-2)' }}>{sortCol === '_status' ? 'Status' : sortCol}</strong> {sortDir === 'asc' ? '↑' : '↓'}
          </span>
          {totalPages > 1 && (
            <div className={s.pageControls}>
              <button className={s.btnGhost} disabled={page <= 1} onClick={() => { setPage(p => p - 1); load(page - 1); }}>← Prev</button>
              <button className={s.btnGhost} disabled={page >= totalPages} onClick={() => { setPage(p => p + 1); load(page + 1); }}>Next →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
