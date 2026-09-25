import { useEffect, useMemo, useState } from 'react';

const API = import.meta.env.VITE_API_URL || '/api';
const defaultUser = { id: null, name: 'Visitante', email: '', role: 'Consulta' };

function App() {
  const [token, setToken] = useState(localStorage.getItem('ecoviva-token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('ecoviva-user') || 'null') || defaultUser);
  const [dashboard, setDashboard] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [works, setWorks] = useState([]);
  const [locations, setLocations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [movements, setMovements] = useState([]);
  const [activeView, setActiveView] = useState('dashboard');
  const [loginForm, setLoginForm] = useState({ email: 'admin@ecoviva.com', password: 'admin123' });
  const [materialForm, setMaterialForm] = useState({
    code: '', internal_code: '', description: '', category_id: '', subcategory: '', unit: 'un', brand: '', model: '', current_stock: 0, minimum_stock: 0, maximum_stock: 0, location_id: '', shelf: '', address: '', supplier_id: '', unit_price: 0, observations: '', barcode: ''
  });
  const [entryForm, setEntryForm] = useState({ material_id: '', date: new Date().toISOString().slice(0, 10), invoice_number: '', supplier_id: '', quantity: 1, unit: '', unit_price: 0, total_value: 0, lot: '', receiver: '', observations: '' });
  const [outputForm, setOutputForm] = useState({ material_id: '', date: new Date().toISOString().slice(0, 10), quantity: 1, unit: '', work_id: '', sector: '', service: '', cost_center: '', employee: '', authorized_by: '', reason: 'Uso na obra', observations: '' });
  const [requestForm, setRequestForm] = useState({ requester: '', work_id: '', sector: '', material_id: '', quantity: 1, request_date: new Date().toISOString().slice(0, 10), priority: 'Média', notes: '' });
  const [statusMessage, setStatusMessage] = useState('');

  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  const fetchData = async () => {
    if (!token) return;
    try {
      const [dashboardRes, materialsRes, categoriesRes, suppliersRes, worksRes, locationsRes, requestsRes, movementsRes] = await Promise.all([
        fetch(`${API}/dashboard`, { headers: authHeaders }),
        fetch(`${API}/materials`, { headers: authHeaders }),
        fetch(`${API}/categories`, { headers: authHeaders }),
        fetch(`${API}/suppliers`, { headers: authHeaders }),
        fetch(`${API}/works`, { headers: authHeaders }),
        fetch(`${API}/locations`, { headers: authHeaders }),
        fetch(`${API}/requests`, { headers: authHeaders }),
        fetch(`${API}/movements`, { headers: authHeaders }),
      ]);

      if ([dashboardRes, materialsRes, categoriesRes, suppliersRes, worksRes, locationsRes, requestsRes, movementsRes].some((res) => !res.ok)) {
        throw new Error('Falha ao carregar dados');
      }

      const dashboardData = await dashboardRes.json();
      const materialsData = await materialsRes.json();
      setDashboard(dashboardData);
      setMaterials(materialsData);
      setCategories(await categoriesRes.json());
      setSuppliers(await suppliersRes.json());
      setWorks(await worksRes.json());
      setLocations(await locationsRes.json());
      setRequests(await requestsRes.json());
      setMovements(await movementsRes.json());
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchData();
  }, [token]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('ecoviva-token', token);
      localStorage.setItem('ecoviva-user', JSON.stringify(user));
    }
  }, [token, user]);

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao fazer login');

      setToken(data.token);
      setUser(data.user);
      setStatusMessage(`Bem-vindo, ${data.user.name}.`);
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(defaultUser);
    localStorage.removeItem('ecoviva-token');
    localStorage.removeItem('ecoviva-user');
    setActiveView('dashboard');
  };

  const handleCreateMaterial = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${API}/materials`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(materialForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao cadastrar material');
      setStatusMessage(data.message);
      setMaterialForm({
        code: '', internal_code: '', description: '', category_id: '', subcategory: '', unit: 'un', brand: '', model: '', current_stock: 0, minimum_stock: 0, maximum_stock: 0, location_id: '', shelf: '', address: '', supplier_id: '', unit_price: 0, observations: '', barcode: ''
      });
      fetchData();
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const handleEntry = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${API}/stock/entry`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(entryForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao registrar entrada');
      setStatusMessage(data.message);
      fetchData();
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const handleOutput = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${API}/stock/output`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(outputForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao registrar saída');
      setStatusMessage(data.message);
      fetchData();
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const handleRequestMaterial = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${API}/requests`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(requestForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao registrar solicitação');
      setStatusMessage(data.message);
      fetchData();
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const totalStockValue = materials.reduce((sum, item) => sum + Number(item.current_stock || 0) * Number(item.unit_price || 0), 0);

  const mobileShortcuts = [
    { label: 'Entrada', view: 'entry' },
    { label: 'Saída', view: 'output' },
    { label: 'Estoque', view: 'stock' },
    { label: 'Solicitações', view: 'requests' },
  ];

  if (!token) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="brand-block">
            <div className="brand-badge">EC</div>
            <div>
              <h1>Ecoviva</h1>
              <p>Controle de Almoxarifado</p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="login-form">
            <label>
              E-mail
              <input type="email" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} />
            </label>
            <label>
              Senha
              <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
            </label>
            <button type="submit">Entrar</button>
            {statusMessage && <p className="message">{statusMessage}</p>}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-box">
          <div className="brand-badge">EC</div>
          <div>
            <h2>Ecoviva</h2>
            <small>{user.role}</small>
          </div>
        </div>
        <nav>
          <button className={activeView === 'dashboard' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveView('dashboard')}>Dashboard</button>
          <button className={activeView === 'materials' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveView('materials')}>Materiais</button>
          <button className={activeView === 'entry' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveView('entry')}>Entrada</button>
          <button className={activeView === 'output' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveView('output')}>Saída</button>
          <button className={activeView === 'stock' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveView('stock')}>Estoque</button>
          <button className={activeView === 'requests' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveView('requests')}>Solicitações</button>
          <button className={activeView === 'movements' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveView('movements')}>Movimentações</button>
          <button className={activeView === 'suppliers' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveView('suppliers')}>Fornecedores</button>
          <button className={activeView === 'works' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveView('works')}>Obras</button>
        </nav>
        <button className="logout" onClick={handleLogout}>Sair</button>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <h1>Almoxarifado</h1>
            <p>Operações da obra em tempo real</p>
          </div>
          <div className="user-pill">{user.name}</div>
        </header>

        <div className="mobile-nav">
          {mobileShortcuts.map((shortcut) => (
            <button key={shortcut.label} onClick={() => setActiveView(shortcut.view)}>
              {shortcut.label}
            </button>
          ))}
        </div>

        {statusMessage && <div className="status-banner">{statusMessage}</div>}

        {activeView === 'dashboard' && dashboard && (
          <section className="content-section">
            <div className="stats-grid">
              <div className="stat-card"><span>Total de itens</span><strong>{dashboard.totals.totalItems}</strong></div>
              <div className="stat-card"><span>Materiais em estoque</span><strong>{dashboard.totals.totalStockQty}</strong></div>
              <div className="stat-card"><span>Estoque baixo</span><strong>{dashboard.totals.lowStock}</strong></div>
              <div className="stat-card"><span>Sem estoque</span><strong>{dashboard.totals.emptyStock}</strong></div>
              <div className="stat-card"><span>Entradas no mês</span><strong>{dashboard.totals.monthEntries}</strong></div>
              <div className="stat-card"><span>Saídas no mês</span><strong>{dashboard.totals.monthOutputs}</strong></div>
              <div className="stat-card"><span>Valor do estoque</span><strong>R$ {Number(dashboard.totals.stockValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
            </div>

            <div className="card-grid two-col">
              <div className="panel-card">
                <h3>Últimas movimentações</h3>
                <ul className="list-simple">
                  {dashboard.lastMovements?.map((item) => (
                    <li key={item.id}><strong>{item.type}</strong> · {item.material_name} · {item.quantity} · {item.user_name}</li>
                  ))}
                </ul>
              </div>
              <div className="panel-card">
                <h3>Materiais mais utilizados</h3>
                <ul className="list-simple">
                  {dashboard.topUsed?.map((item) => (
                    <li key={item.description}><span>{item.description}</span><strong>{item.total}</strong></li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="card-grid two-col">
              <div className="panel-card">
                <h3>Alertas de estoque</h3>
                <ul className="list-simple">
                  {dashboard.lowItems?.map((item) => (
                    <li key={item.id} className="danger-row"><span>{item.description}</span><strong>{item.current_stock} / {item.minimum_stock}</strong></li>
                  ))}
                </ul>
              </div>
              <div className="panel-card">
                <h3>Resumo financeiro</h3>
                <p>Valor total em estoque: R$ {Number(totalStockValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </section>
        )}

        {activeView === 'materials' && (
          <section className="content-section form-layout">
            <div className="panel-card full">
              <h3>Cadastrar material</h3>
              <form onSubmit={handleCreateMaterial} className="form-grid">
                <input placeholder="Código" value={materialForm.code} onChange={(e) => setMaterialForm({ ...materialForm, code: e.target.value })} />
                <input placeholder="Código interno" value={materialForm.internal_code} onChange={(e) => setMaterialForm({ ...materialForm, internal_code: e.target.value })} />
                <input placeholder="Descrição" value={materialForm.description} onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })} />
                <select value={materialForm.category_id} onChange={(e) => setMaterialForm({ ...materialForm, category_id: e.target.value })}>
                  <option value="">Categoria</option>
                  {categories.map((category) => (<option key={category.id} value={category.id}>{category.name}</option>))}
                </select>
                <input placeholder="Subcategoria" value={materialForm.subcategory} onChange={(e) => setMaterialForm({ ...materialForm, subcategory: e.target.value })} />
                <input placeholder="Unidade" value={materialForm.unit} onChange={(e) => setMaterialForm({ ...materialForm, unit: e.target.value })} />
                <input placeholder="Marca" value={materialForm.brand} onChange={(e) => setMaterialForm({ ...materialForm, brand: e.target.value })} />
                <input placeholder="Modelo" value={materialForm.model} onChange={(e) => setMaterialForm({ ...materialForm, model: e.target.value })} />
                <input type="number" placeholder="Estoque atual" value={materialForm.current_stock} onChange={(e) => setMaterialForm({ ...materialForm, current_stock: Number(e.target.value) })} />
                <input type="number" placeholder="Estoque mínimo" value={materialForm.minimum_stock} onChange={(e) => setMaterialForm({ ...materialForm, minimum_stock: Number(e.target.value) })} />
                <input type="number" placeholder="Estoque máximo" value={materialForm.maximum_stock} onChange={(e) => setMaterialForm({ ...materialForm, maximum_stock: Number(e.target.value) })} />
                <select value={materialForm.location_id} onChange={(e) => setMaterialForm({ ...materialForm, location_id: e.target.value })}>
                  <option value="">Localização</option>
                  {locations.map((location) => (<option key={location.id} value={location.id}>{location.name}</option>))}
                </select>
                <input placeholder="Prateleira" value={materialForm.shelf} onChange={(e) => setMaterialForm({ ...materialForm, shelf: e.target.value })} />
                <input placeholder="Endereço" value={materialForm.address} onChange={(e) => setMaterialForm({ ...materialForm, address: e.target.value })} />
                <select value={materialForm.supplier_id} onChange={(e) => setMaterialForm({ ...materialForm, supplier_id: e.target.value })}>
                  <option value="">Fornecedor</option>
                  {suppliers.map((supplier) => (<option key={supplier.id} value={supplier.id}>{supplier.corporate_name}</option>))}
                </select>
                <input type="number" step="0.01" placeholder="Preço unitário" value={materialForm.unit_price} onChange={(e) => setMaterialForm({ ...materialForm, unit_price: Number(e.target.value) })} />
                <input placeholder="Código de barras" value={materialForm.barcode} onChange={(e) => setMaterialForm({ ...materialForm, barcode: e.target.value })} />
                <textarea rows="3" placeholder="Observações" value={materialForm.observations} onChange={(e) => setMaterialForm({ ...materialForm, observations: e.target.value })}></textarea>
                <button type="submit" className="primary-btn">Salvar material</button>
              </form>
            </div>
          </section>
        )}

        {activeView === 'entry' && (
          <section className="content-section form-layout">
            <div className="panel-card full">
              <h3>Registrar entrada</h3>
              <form onSubmit={handleEntry} className="form-grid">
                <input type="date" value={entryForm.date} onChange={(e) => setEntryForm({ ...entryForm, date: e.target.value })} />
                <input placeholder="Nº nota" value={entryForm.invoice_number} onChange={(e) => setEntryForm({ ...entryForm, invoice_number: e.target.value })} />
                <select value={entryForm.material_id} onChange={(e) => setEntryForm({ ...entryForm, material_id: e.target.value })}>
                  <option value="">Material</option>
                  {materials.map((material) => (<option key={material.id} value={material.id}>{material.description}</option>))}
                </select>
                <select value={entryForm.supplier_id} onChange={(e) => setEntryForm({ ...entryForm, supplier_id: e.target.value })}>
                  <option value="">Fornecedor</option>
                  {suppliers.map((supplier) => (<option key={supplier.id} value={supplier.id}>{supplier.corporate_name}</option>))}
                </select>
                <input type="number" placeholder="Quantidade" value={entryForm.quantity} onChange={(e) => setEntryForm({ ...entryForm, quantity: Number(e.target.value) })} />
                <input placeholder="Unidade" value={entryForm.unit} onChange={(e) => setEntryForm({ ...entryForm, unit: e.target.value })} />
                <input type="number" step="0.01" placeholder="Valor unitário" value={entryForm.unit_price} onChange={(e) => setEntryForm({ ...entryForm, unit_price: Number(e.target.value) })} />
                <input type="number" step="0.01" placeholder="Valor total" value={entryForm.total_value} onChange={(e) => setEntryForm({ ...entryForm, total_value: Number(e.target.value) })} />
                <input placeholder="Lote" value={entryForm.lot} onChange={(e) => setEntryForm({ ...entryForm, lot: e.target.value })} />
                <input placeholder="Responsável" value={entryForm.receiver} onChange={(e) => setEntryForm({ ...entryForm, receiver: e.target.value })} />
                <textarea rows="3" placeholder="Observações" value={entryForm.observations} onChange={(e) => setEntryForm({ ...entryForm, observations: e.target.value })}></textarea>
                <button type="submit" className="primary-btn">Confirmar entrada</button>
              </form>
            </div>
          </section>
        )}

        {activeView === 'output' && (
          <section className="content-section form-layout">
            <div className="panel-card full">
              <h3>Registrar saída</h3>
              <form onSubmit={handleOutput} className="form-grid">
                <input type="date" value={outputForm.date} onChange={(e) => setOutputForm({ ...outputForm, date: e.target.value })} />
                <select value={outputForm.material_id} onChange={(e) => setOutputForm({ ...outputForm, material_id: e.target.value })}>
                  <option value="">Material</option>
                  {materials.map((material) => (<option key={material.id} value={material.id}>{material.description}</option>))}
                </select>
                <input type="number" placeholder="Quantidade" value={outputForm.quantity} onChange={(e) => setOutputForm({ ...outputForm, quantity: Number(e.target.value) })} />
                <input placeholder="Unidade" value={outputForm.unit} onChange={(e) => setOutputForm({ ...outputForm, unit: e.target.value })} />
                <select value={outputForm.work_id} onChange={(e) => setOutputForm({ ...outputForm, work_id: e.target.value })}>
                  <option value="">Obra</option>
                  {works.map((work) => (<option key={work.id} value={work.id}>{work.name}</option>))}
                </select>
                <input placeholder="Setor" value={outputForm.sector} onChange={(e) => setOutputForm({ ...outputForm, sector: e.target.value })} />
                <input placeholder="Serviço" value={outputForm.service} onChange={(e) => setOutputForm({ ...outputForm, service: e.target.value })} />
                <input placeholder="Centro de custo" value={outputForm.cost_center} onChange={(e) => setOutputForm({ ...outputForm, cost_center: e.target.value })} />
                <input placeholder="Funcionário" value={outputForm.employee} onChange={(e) => setOutputForm({ ...outputForm, employee: e.target.value })} />
                <input placeholder="Autorizado por" value={outputForm.authorized_by} onChange={(e) => setOutputForm({ ...outputForm, authorized_by: e.target.value })} />
                <input placeholder="Motivo" value={outputForm.reason} onChange={(e) => setOutputForm({ ...outputForm, reason: e.target.value })} />
                <textarea rows="3" placeholder="Observações" value={outputForm.observations} onChange={(e) => setOutputForm({ ...outputForm, observations: e.target.value })}></textarea>
                <button type="submit" className="primary-btn">Confirmar saída</button>
              </form>
            </div>
          </section>
        )}

        {activeView === 'stock' && (
          <section className="content-section">
            <div className="panel-card full">
              <h3>Estoque</h3>
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Material</th>
                    <th>Categoria</th>
                    <th>Unidade</th>
                    <th>Estoque</th>
                    <th>Mín.</th>
                    <th>Máx.</th>
                    <th>Localização</th>
                    <th>Preço</th>
                    <th>Valor</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((item) => (
                    <tr key={item.id}>
                      <td>{item.code}</td>
                      <td>{item.description}</td>
                      <td>{item.category_name || '—'}</td>
                      <td>{item.unit}</td>
                      <td>{item.current_stock}</td>
                      <td>{item.minimum_stock}</td>
                      <td>{item.maximum_stock}</td>
                      <td>{item.location_name || item.address || '—'}</td>
                      <td>R$ {Number(item.unit_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td>R$ {Number(item.current_stock * item.unit_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td><span className={item.status === 'Sem estoque' ? 'pill danger' : item.status === 'Estoque baixo' ? 'pill warning' : 'pill success'}>{item.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeView === 'requests' && (
          <section className="content-section form-layout">
            <div className="panel-card">
              <h3>Solicitar material</h3>
              <form onSubmit={handleRequestMaterial} className="form-grid">
                <input placeholder="Solicitante" value={requestForm.requester} onChange={(e) => setRequestForm({ ...requestForm, requester: e.target.value })} />
                <select value={requestForm.work_id} onChange={(e) => setRequestForm({ ...requestForm, work_id: e.target.value })}>
                  <option value="">Obra</option>
                  {works.map((work) => (<option key={work.id} value={work.id}>{work.name}</option>))}
                </select>
                <input placeholder="Setor" value={requestForm.sector} onChange={(e) => setRequestForm({ ...requestForm, sector: e.target.value })} />
                <select value={requestForm.material_id} onChange={(e) => setRequestForm({ ...requestForm, material_id: e.target.value })}>
                  <option value="">Material</option>
                  {materials.map((material) => (<option key={material.id} value={material.id}>{material.description}</option>))}
                </select>
                <input type="number" placeholder="Quantidade" value={requestForm.quantity} onChange={(e) => setRequestForm({ ...requestForm, quantity: Number(e.target.value) })} />
                <input type="date" value={requestForm.request_date} onChange={(e) => setRequestForm({ ...requestForm, request_date: e.target.value })} />
                <select value={requestForm.priority} onChange={(e) => setRequestForm({ ...requestForm, priority: e.target.value })}>
                  <option value="Baixa">Baixa</option>
                  <option value="Média">Média</option>
                  <option value="Alta">Alta</option>
                  <option value="Urgente">Urgente</option>
                </select>
                <textarea rows="2" placeholder="Observação" value={requestForm.notes} onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}></textarea>
                <button type="submit" className="primary-btn">Salvar solicitação</button>
              </form>
            </div>
            <div className="panel-card">
              <h3>Solicitações</h3>
              <ul className="list-simple">
                {requests.map((request) => (
                  <li key={request.id}>
                    <strong>{request.material_name}</strong> · {request.quantity} · {request.status}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {activeView === 'movements' && (
          <section className="content-section">
            <div className="panel-card full">
              <h3>Histórico de movimentações</h3>
              <table>
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Material</th>
                    <th>Qtd.</th>
                    <th>Anterior</th>
                    <th>Atual</th>
                    <th>Usuário</th>
                    <th>Obra</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((item) => (
                    <tr key={item.id}>
                      <td>{item.type}</td>
                      <td>{item.material_name || '—'}</td>
                      <td>{item.quantity}</td>
                      <td>{item.previous_stock}</td>
                      <td>{item.current_stock}</td>
                      <td>{item.user_name || '—'}</td>
                      <td>{item.work_name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeView === 'suppliers' && (
          <section className="content-section">
            <div className="panel-card full">
              <h3>Fornecedores</h3>
              <ul className="list-simple">
                {suppliers.map((supplier) => (
                  <li key={supplier.id}><strong>{supplier.corporate_name}</strong> · {supplier.city || '—'} · {supplier.phone || '—'}</li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {activeView === 'works' && (
          <section className="content-section">
            <div className="panel-card full">
              <h3>Obras</h3>
              <ul className="list-simple">
                {works.map((work) => (
                  <li key={work.id}><strong>{work.name}</strong> · {work.code} · {work.status}</li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
