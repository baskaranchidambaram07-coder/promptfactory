import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../api/adminApi';
import s from './Admin.module.css';

const EMPTY_FORM = {
  promptdescription: '', Categories: '', tags: '',
  FromURL: '', ToURL: '', usedcount: 0,
};

// Columns config: key = field on item, label = header text, sortable
const COLS = [
  { key: 'PromptId',          label: 'ID',               sortable: true,  width: 60  },
  { key: '_images',           label: 'Images',            sortable: false              },
  { key: 'Categories',        label: 'Category',          sortable: true               },
  { key: 'tags',              label: 'Tags',              sortable: true               },
  { key: 'promptdescription', label: 'Description',       sortable: true               },
  { key: 'usedcount',         label: 'Uses',              sortable: true,  width: 80  },
  { key: '_actions',          label: 'Actions',           sortable: false              },
];

function SortIcon({ col, sortCol, sortDir }) {
  if (!col.sortable) return null;
  const active = sortCol === col.key;
  const arrow = active ? (sortDir === 'asc' ? '↑' : '↓') : '↕';
  return <span className={`${s.sortIcon} ${active ? s.thActive : ''}`}>{arrow}</span>;
}

export default function Prompts() {
  const [items, setItems]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [catFilter, setCat]   = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]   = useState(null);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState(null);

  // Sorting — default: PromptId ascending
  const [sortCol, setSortCol] = useState('PromptId');
  const [sortDir, setSortDir] = useState('asc');

  const LIMIT = 25;

  const load = useCallback((p = page) => {
    setLoading(true);
    const params = new URLSearchParams({ page: p, limit: LIMIT });
    if (search)    params.set('search', search);
    if (catFilter) params.set('category', catFilter);
    api.get(`/admin/collection?${params}`)
      .then((r) => { setItems(r.data.data || []); setTotal(r.data.total || 0); })
      .catch(() => flash('error', 'Failed to load prompts'))
      .finally(() => setLoading(false));
  }, [page, search, catFilter]);

  useEffect(() => { load(); }, [load]);

  // Client-side sort applied on top of the fetched page
  const sorted = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      let av = a[sortCol] ?? '';
      let bv = b[sortCol] ?? '';
      // Numeric cols
      if (sortCol === 'PromptId' || sortCol === 'usedcount') {
        av = Number(av) || 0;
        bv = Number(bv) || 0;
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      // String cols
      av = String(av).toLowerCase();
      bv = String(bv).toLowerCase();
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

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const openAdd = () => { setEditId(null); setForm(EMPTY_FORM); setShowForm(true); };

  const openEdit = (item) => {
    setEditId(item.PromptId);
    setForm({
      promptdescription: item.promptdescription || '',
      Categories: item.Categories || '',
      tags: item.tags || '',
      FromURL: item.FromURL || '',
      ToURL: item.ToURL || '',
      usedcount: item.usedcount || 0,
    });
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, usedcount: parseInt(form.usedcount) || 0 };
      if (editId) {
        await api.put(`/admin/collection/${editId}`, payload);
        flash('success', 'Prompt updated');
      } else {
        await api.post('/admin/collection', payload);
        flash('success', 'Prompt created');
      }
      setShowForm(false);
      setEditId(null);
      setForm(EMPTY_FORM);
      load(1); setPage(1);
    } catch (err) {
      flash('error', err.response?.data?.error || 'Save failed');
    }
    setSaving(false);
  };

  const del = async (id) => {
    if (!confirm('Delete this prompt? It will no longer appear on the home page.')) return;
    try {
      await api.delete(`/admin/collection/${id}`);
      flash('success', 'Prompt deleted');
      load();
    } catch { flash('error', 'Delete failed'); }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className={s.pageHeader}>
        <div>
          <div className={s.pageTitle}>Prompt Management</div>
          <div className={s.pageSub}>Manages the PromptCollection — directly powers the home page</div>
        </div>
        <button className={s.btnPrimary} onClick={openAdd}>+ Add Prompt</button>
      </div>

      {msg && <div className={msg.type === 'success' ? s.alertSuccess : s.alertError}>{msg.text}</div>}

      {/* Filters */}
      <div className={s.panel}>
        <div className={s.panelHeader}><div className={s.panelTitle}>Filters</div></div>
        <div style={{ padding: '14px 20px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input className={s.searchInput} placeholder="Search description, category, tags…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <input className={s.searchInput} style={{ width: 160 }} placeholder="Category filter…" value={catFilter} onChange={(e) => setCat(e.target.value)} />
          <button className={s.btnGhost} onClick={() => { setPage(1); load(1); }}>Search</button>
          <button className={s.btnGhost} onClick={() => { setSearch(''); setCat(''); setPage(1); }}>Clear</button>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--pf-text-3)' }}>{total} total prompts</span>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className={s.panel}>
          <div className={s.panelHeader}>
            <div className={s.panelTitle}>{editId ? `Edit Prompt #${editId}` : 'New Prompt'}</div>
            <button className={s.btnGhost} onClick={() => setShowForm(false)}>✕ Cancel</button>
          </div>
          <form onSubmit={save}>
            <div className={s.formGrid}>
              <div className={s.field}>
                <label className={s.label}>Category</label>
                <input className={s.input} placeholder="Couples, Travel, Music…" value={form.Categories} onChange={set('Categories')} required />
              </div>
              <div className={s.field}>
                <label className={s.label}>Tags</label>
                <input className={s.input} placeholder="romantic, sunset, portrait" value={form.tags} onChange={set('tags')} />
              </div>
              <div className={s.fieldFull}>
                <label className={s.label}>Prompt Description</label>
                <textarea className={s.textarea} style={{ minHeight: 110 }} placeholder="Full AI prompt text…" value={form.promptdescription} onChange={set('promptdescription')} required />
              </div>
              <div className={s.field}>
                <label className={s.label}>From (Before) Image URL</label>
                <input className={s.input} placeholder="https://…" value={form.FromURL} onChange={set('FromURL')} />
              </div>
              <div className={s.field}>
                <label className={s.label}>To (After) Image URL</label>
                <input className={s.input} placeholder="https://…" value={form.ToURL} onChange={set('ToURL')} />
              </div>
              <div className={s.field}>
                <label className={s.label}>Used Count</label>
                <input className={s.input} type="number" min="0" value={form.usedcount} onChange={set('usedcount')} />
              </div>
            </div>
            {(form.FromURL || form.ToURL) && (
              <div style={{ padding: '0 20px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--pf-text-3)', fontWeight: 600 }}>Preview:</span>
                {form.FromURL && <img src={form.FromURL} alt="from" className={s.imgThumb} style={{ width: 80, height: 80 }} onError={(e) => e.target.style.display = 'none'} />}
                {form.FromURL && form.ToURL && <span className={s.imgArrow}>→</span>}
                {form.ToURL && <img src={form.ToURL} alt="to" className={s.imgThumb} style={{ width: 80, height: 80 }} onError={(e) => e.target.style.display = 'none'} />}
              </div>
            )}
            <div className={s.formFooter}>
              <button type="submit" className={s.btnPrimary} disabled={saving}>
                {saving ? 'Saving…' : editId ? 'Update Prompt' : 'Create Prompt'}
              </button>
              <button type="button" className={s.btnGhost} onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className={s.panel}>
        <div className={s.tableWrap}>
          {loading ? (
            <div className={s.loading}>Loading prompts…</div>
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
                    <td>
                      <div className={s.imgPair}>
                        {item.FromURL
                          ? <img src={item.FromURL} alt="from" className={s.imgThumb} onError={(e) => e.target.style.display = 'none'} />
                          : <div className={s.imgThumb} style={{ display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, opacity:0.3 }}>🖼️</div>
                        }
                        <span className={s.imgArrow}>→</span>
                        {item.ToURL
                          ? <img src={item.ToURL} alt="to" className={s.imgThumb} onError={(e) => e.target.style.display = 'none'} />
                          : <div className={s.imgThumb} style={{ display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, opacity:0.3 }}>🖼️</div>
                        }
                      </div>
                    </td>
                    <td><span className={s.pill}>{item.Categories || '—'}</span></td>
                    <td style={{ fontSize:12, color:'var(--pf-text-3)', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {item.tags || '—'}
                    </td>
                    <td style={{ maxWidth:240, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12, color:'var(--pf-text-2)' }}>
                      {(item.promptdescription || '').slice(0, 100) || '—'}
                    </td>
                    <td className={s.tdBold}>{(item.usedcount || 0).toLocaleString()}</td>
                    <td>
                      <div className={s.actions}>
                        <button className={s.btnSm} onClick={() => openEdit(item)}>Edit</button>
                        <button className={s.btnDanger} onClick={() => del(item.PromptId)}>Delete</button>
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
            {' '}· sorted by <strong style={{ color: 'var(--pf-text-2)' }}>{sortCol}</strong> {sortDir === 'asc' ? '↑' : '↓'}
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
