const STORAGE_KEY = 'reeabrica-app-state';

const GOVERNORATES = [
  'القاهرة','الجيزة','الإسكندرية','الدقهلية','البحر الأحمر','البحيرة','الفيوم','الغربية','الإسماعيلية','المنوفية','المنيا','القليوبية','الوادي الجديد','السويس','أسوان','أسيوط','بني سويف','بورسعيد','دمياط','الشرقية','جنوب سيناء','كفر الشيخ','مطروح','الأقصر','قنا','شمال سيناء','سوهاج'
];

const MATERIAL_TYPES = [
  'قطن','كتان','صوف','حرير','بوليستر','فيسكوز','جبردين','جينز','شيفون','كريب','ساتان','ليكرا','مخمل','جوخ','تول','دانتيل','جلد','فرو','قماش تنجيد'
];

const COLOR_OPTIONS = [
  'أحمر','أزرق','أخضر','أصفر','أسود','أبيض','بني','رمادي','بيج','كحلي','موف','بمبي','تركواز','زيتي','جملي','سكري'
];

const defaultUsers = [];

const defaultProducts = [];

const defaultFavorites = [];

const defaultOrders = [];

let state = loadState();
let selectedProductId = null;
let registerType = 'seller';

function createInitialState() {
  return {
    users: defaultUsers,
    products: defaultProducts,
    favorites: defaultFavorites,
    orders: defaultOrders,
    currentUserId: null,
    currentScreen: 'welcome'
  };
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return createInitialState();
  }

  try {
    return JSON.parse(saved);
  } catch (error) {
    return createInitialState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getCurrentUser() {
  return state.users.find((user) => user.userId === state.currentUserId) || null;
}

function getProductById(id) {
  return state.products.find((product) => product.productId === id);
}

function getUserById(id) {
  return state.users.find((user) => user.userId === id);
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

function setScreen(name) {
  state.currentScreen = name;
  const pages = document.querySelectorAll('.page');
  pages.forEach((page) => {
    page.classList.toggle('active', page.id === `${name}-screen`);
  });

  const navButtons = document.querySelectorAll('.nav-item');
  navButtons.forEach((button) => {
    const isActive = button.dataset.screen === name;
    button.classList.toggle('active', isActive);
  });

  const topbar = document.querySelector('.topbar');
  const isWelcome = name === 'welcome';
  topbar.classList.toggle('hidden-on-welcome', isWelcome);

  document.body.classList.toggle('body-logged-in', !!getCurrentUser());
  if (name === 'welcome') {
    closeModal();
  }

  renderNavVisibility();
  renderAll();
  updateHeaderUserBadge();
}

function renderNavVisibility() {
  const user = getCurrentUser();
  const sellerOnly = document.querySelector('.seller-only');
  if (user && user.userType === 'seller') {
    sellerOnly.style.display = 'flex';
  } else {
    sellerOnly.style.display = 'none';
  }
}

function renderAll() {
  const user = getCurrentUser();
  document.querySelectorAll('.page').forEach((page) => {
    page.classList.toggle('active', page.id === `${state.currentScreen}-screen`);
  });

  const authScreen = document.getElementById('auth-screen');
  if (user) {
    authScreen.classList.remove('active');
  }

  if (state.currentScreen === 'market') renderProducts();
  if (state.currentScreen === 'favorites') renderFavorites();
  if (state.currentScreen === 'orders') renderOrders();
  if (state.currentScreen === 'profile') renderProfile();
  if (state.currentScreen === 'add-product') renderAddProductForm();
  renderDashboardSummary();
  renderSustainabilityCard();
  renderNavVisibility();
  updateHeaderUserBadge();
}

function openAuth(mode) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const title = document.getElementById('authTitle');

  const isLogin = mode === 'login';
  loginForm.classList.toggle('active-form', isLogin);
  registerForm.classList.toggle('active-form', !isLogin);
  title.textContent = isLogin ? 'تسجيل الدخول' : 'إنشاء حساب';
  state.currentScreen = 'auth';
  document.getElementById('welcome-screen').classList.remove('active');
  document.getElementById('auth-screen').classList.add('active');
  document.querySelector('.topbar').classList.remove('hidden-on-welcome');
  syncRegistrationFields();
  updateHeaderUserBadge();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('فشل في قراءة الصورة'));
    reader.readAsDataURL(file);
  });
}

function updateHeaderUserBadge() {
  const user = getCurrentUser();
  const badge = document.getElementById('headerUserBadge');
  if (!badge) return;

  if (!user) {
    badge.innerHTML = '';
    return;
  }

  const avatarImage = user.profileImage ? `<img src="${user.profileImage}" alt="${user.name}" />` : `<span>${user.name.substring(0, 1).toUpperCase()}</span>`;
  const displayName = user.factoryName && user.factoryName !== 'غير محدد' ? user.factoryName : user.name;
  badge.innerHTML = `
    <div class="header-user-avatar">${avatarImage}</div>
    <span>${displayName}</span>
  `;
}

function syncRegistrationFields() {
  const sellerFields = document.getElementById('sellerFields');
  const factoryInput = document.getElementById('regFactoryName');
  const governorateInput = document.getElementById('regGovernorate');
  const isSellerSelected = registerType === 'seller';

  if (sellerFields) {
    sellerFields.classList.toggle('hidden', !isSellerSelected);
  }

  if (factoryInput) {
    factoryInput.required = isSellerSelected;
    factoryInput.disabled = !isSellerSelected;
    if (!isSellerSelected) factoryInput.value = '';
  }

  if (governorateInput) {
    governorateInput.required = isSellerSelected;
    governorateInput.disabled = !isSellerSelected;
    if (!isSellerSelected) governorateInput.value = '';
  }
}

function fillRegistrationSelectors() {
  const governorateSelect = document.getElementById('regGovernorate');
  if (governorateSelect) {
    governorateSelect.innerHTML = ['<option value="">اختر المحافظة</option>', ...GOVERNORATES.map((governorate) => `<option value="${governorate}">${governorate}</option>`)].join('');
  }
}

function loginUser(identifier, password) {
  const foundUser = state.users.find((user) => {
    const matchesEmail = user.email.toLowerCase() === identifier.toLowerCase();
    const matchesPhone = user.phone === identifier;
    const matchesPassword = user.password === password;
    return (matchesEmail || matchesPhone) && matchesPassword;
  });

  if (!foundUser) {
    document.getElementById('loginError').textContent = 'بيانات الدخول غير صحيحة، يرجى التحقق من البريد/الرقم وكلمة المرور.';
    return;
  }

  state.currentUserId = foundUser.userId;
  saveState();
  showToast(`مرحبًا ${foundUser.name}`);
  setScreen('market');
}

function registerUser(event) {
  event.preventDefault();

  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const password = document.getElementById('regPassword').value.trim();
  const factoryName = document.getElementById('regFactoryName').value.trim();
  const governorate = document.getElementById('regGovernorate').value.trim();
  const city = document.getElementById('regCity').value.trim();
  const address = document.getElementById('regAddress').value.trim();
  const profileUpload = document.getElementById('profileImageUpload');
  const errorEl = document.getElementById('registerError');

  const isSellerSelected = registerType === 'seller';
  if (!name || !email || !phone || !password || !city || !address) {
    errorEl.textContent = 'يرجى تعبئة جميع الحقول المطلوبة.';
    return;
  }

  if (isSellerSelected && (!factoryName || !governorate)) {
    errorEl.textContent = 'يرجى تعبئة اسم المصنع والمحافظة كـ بائع.';
    return;
  }

  if (state.users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
    errorEl.textContent = 'هذا البريد الإلكتروني مسجل مسبقًا.';
    return;
  }

  const profileImage = profileUpload && profileUpload.files && profileUpload.files[0]
    ? profileUpload.files[0]
    : null;

  const saveUser = async () => {
    const imageData = profileImage ? await readFileAsDataUrl(profileImage) : '';

    const newUser = {
      userId: `u${Date.now()}`,
      name,
      email,
      phone,
      password,
      userType: registerType,
      factoryName: isSellerSelected ? (factoryName || 'غير محدد') : 'غير محدد',
      governorate: isSellerSelected ? (governorate || 'غير محدد') : 'غير محدد',
      city,
      address,
      profileImage: imageData,
      createdAt: new Date().toISOString()
    };

    state.users.push(newUser);
    state.currentUserId = newUser.userId;
    saveState();
    event.target.reset();
    syncRegistrationFields();
    updateHeaderUserBadge();
    showToast('تم إنشاء الحساب بنجاح');
    setScreen('market');
  };

  saveUser().catch(() => {
    errorEl.textContent = 'حدث خطأ أثناء حفظ الصورة، يرجى المحاولة مرة أخرى.';
  });
}

function logout() {
  state.currentUserId = null;
  saveState();
  setScreen('welcome');
}

function renderProducts() {
  const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
  const typeQuery = document.getElementById('typeFilter').value;
  const colorQuery = document.getElementById('colorFilter').value;
  const governorateQuery = document.getElementById('governorateFilter').value;
  const statusQuery = document.getElementById('statusFilter').value;

  let filtered = state.products.filter((product) => {
    const matchesSearch = !searchTerm || [product.productName, product.materialType, product.color, product.condition].join(' ').toLowerCase().includes(searchTerm);
    const matchesType = !typeQuery || product.materialType === typeQuery;
    const matchesColor = !colorQuery || product.color === colorQuery;
    const matchesGovernorate = !governorateQuery || product.governorate === governorateQuery;
    const matchesStatus = !statusQuery || product.status === statusQuery;
    return matchesSearch && matchesType && matchesColor && matchesGovernorate && matchesStatus;
  });

  const grid = document.getElementById('productsGrid');

  populateSelect('typeFilter', MATERIAL_TYPES, 'نوع القماش');
  populateSelect('colorFilter', COLOR_OPTIONS, 'اللون');
  populateSelect('governorateFilter', GOVERNORATES, 'المحافظة');

  if (!filtered.length) {
    grid.innerHTML = '<div class="card" style="padding:18px; text-align:center; color: var(--muted);">لا توجد خامات تطابق البحث الحالي.</div>';
    return;
  }

  grid.innerHTML = filtered.map((product) => {
    const isFavorite = state.favorites.some((fav) => fav.userId === state.currentUserId && fav.productId === product.productId);
    const imageUrl = normalizeProductImage(product);
    return `
      <article class="product-card">
        <div class="image-wrap">
          <img src="${imageUrl}" alt="${product.productName}" />
          <button class="favorite-button ${isFavorite ? 'active' : ''}" data-favorite-id="${product.productId}" type="button" aria-label="إضافة للمفضلة">❤</button>
        </div>
        <div class="body">
          <div class="product-name-row">
            <h3>${product.productName}</h3>
            <span class="material-type">${product.materialType}</span>
          </div>
          <div class="meta-list">
            <span><label>الكمية</label><strong>${product.quantity} ${product.unit}</strong></span>
            <span><label>السعر</label><strong>${product.price} جنيه/${product.unit}</strong></span>
            <span><label>المكان</label><strong>${product.governorate}</strong></span>
          </div>
          <div class="card-actions">
            <button type="button" class="link-button" data-open-product="${product.productId}">فتح التفاصيل</button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function populateSelect(selectId, values, placeholder) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const currentValue = select.value;
  const options = ['<option value="">'+placeholder+'</option>'];
  values.forEach((value) => {
    const safeValue = String(value).trim();
    if (!safeValue) return;
    const selected = currentValue === safeValue ? 'selected' : '';
    options.push(`<option value="${safeValue}" ${selected}>${safeValue}</option>`);
  });
  select.innerHTML = options.join('');
}

function renderFavorites() {
  const user = getCurrentUser();
  const grid = document.getElementById('favoritesGrid');
  if (!user) {
    grid.innerHTML = '<div class="card" style="padding:18px; color: var(--muted); text-align:center;">يرجى تسجيل الدخول لعرض المفضلة.</div>';
    return;
  }

  const favoriteProducts = state.favorites
    .filter((fav) => fav.userId === user.userId)
    .map((fav) => getProductById(fav.productId))
    .filter(Boolean);

  if (!favoriteProducts.length) {
    grid.innerHTML = '<div class="card" style="padding:18px; color: var(--muted); text-align:center;">لا توجد خامات محفوظة حاليًا.</div>';
    return;
  }

  grid.innerHTML = favoriteProducts.map((product) => `
    <article class="product-card">
      <div class="image-wrap">
        <img src="${normalizeProductImage(product)}" alt="${product.productName}" />
      </div>
      <div class="body">
        <div class="product-name-row">
          <h3>${product.productName}</h3>
          <span class="material-type">${product.materialType}</span>
        </div>
        <div class="meta-list">
          <span><label>الكمية</label><strong>${product.quantity} ${product.unit}</strong></span>
          <span><label>السعر</label><strong>${product.price} جنيه/${product.unit}</strong></span>
        </div>
        <div class="card-actions">
          <button type="button" class="link-button" data-open-product="${product.productId}">فتح التفاصيل</button>
          <button type="button" class="secondary-button" data-remove-favorite="${product.productId}">إزالة</button>
        </div>
      </div>
    </article>
  `).join('');
}

function renderOrders() {
  const user = getCurrentUser();
  const ordersList = document.getElementById('ordersList');
  if (!user) {
    ordersList.innerHTML = '<div class="card" style="padding:18px; color: var(--muted); text-align:center;">سجل الدخول لعرض طلباتك.</div>';
    return;
  }

  const relevantOrders = state.orders.filter((order) => {
    if (user.userType === 'buyer') return order.buyerId === user.userId;
    return order.sellerId === user.userId;
  });

  if (!relevantOrders.length) {
    ordersList.innerHTML = '<div class="card" style="padding:18px; color: var(--muted); text-align:center;">لا توجد طلبات حتى الآن.</div>';
    return;
  }

  ordersList.innerHTML = relevantOrders.map((order) => {
    const product = getProductById(order.productId);
    const buyer = getUserById(order.buyerId);
    const seller = getUserById(order.sellerId);
    const statusClass = `status-${order.status}`;
    return `
      <article class="order-card">
        <div class="order-top">
          <div class="order-product">
            <img src="${product?.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518'}" alt="" />
            <div>
              <h3>${product?.productName || 'منتج'}</h3>
              <small>${user.userType === 'buyer' ? 'البائع' : 'المشتري'}: ${user.userType === 'buyer' ? seller?.name : buyer?.name}</small>
            </div>
          </div>
          <span class="status-pill ${statusClass}">${mapOrderStatus(order.status)}</span>
        </div>
        <div class="order-bottom">
          <div>
            <div>الكمية: ${order.requestedQuantity}</div>
            <div>الإجمالي: ${order.totalPrice} جنيه</div>
          </div>
          <div>${new Date(order.createdAt).toLocaleDateString('ar-EG')}</div>
        </div>
        ${user.userType === 'seller' && order.status === 'pending' ? `
          <div class="order-actions">
            <button class="accept-btn" data-order-action="accept" data-order-id="${order.orderId}">قبول الطلب</button>
            <button class="reject-btn" data-order-action="reject" data-order-id="${order.orderId}">رفض الطلب</button>
          </div>
        ` : ''}
      </article>
    `;
  }).join('');
}

function renderProfile() {
  const user = getCurrentUser();
  const card = document.getElementById('profileCard');
  if (!user) {
    card.innerHTML = '<div class="card" style="padding:18px; color: var(--muted); text-align:center;">قم بتسجيل الدخول لعرض الملف الشخصي.</div>';
    return;
  }

  const initials = user.name.substring(0, 2).toUpperCase();
  const avatarHtml = user.profileImage ? `<img src="${user.profileImage}" alt="${user.name}" class="avatar-image" />` : `<div class="avatar">${initials}</div>`;
  card.innerHTML = `
    <div class="profile-header">
      ${avatarHtml}
      <h3>${user.name}</h3>
      <p>${user.userType === 'seller' ? 'بائع' : 'مشتري'}</p>
    </div>
    <div class="info-list">
      <div class="info-item"><span>اسم المصنع</span><strong>${user.factoryName}</strong></div>
      <div class="info-item"><span>رقم الهاتف</span><strong>${user.phone}</strong></div>
      <div class="info-item"><span>البريد الإلكتروني</span><strong>${user.email}</strong></div>
      <div class="info-item"><span>المحافظة</span><strong>${user.governorate}</strong></div>
      <div class="info-item"><span>المدينة</span><strong>${user.city}</strong></div>
      <div class="info-item"><span>العنوان</span><strong>${user.address}</strong></div>
    </div>
    <button type="button" class="primary-button full-width" id="editProfileBtn">تعديل البيانات</button>
  `;
  
  const editBtn = document.getElementById('editProfileBtn');
  if (editBtn) {
    editBtn.addEventListener('click', openEditProfileModal);
  }
}

function openEditProfileModal() {
  const user = getCurrentUser();
  if (!user) return;
  
  const modal = document.getElementById('productModal');
  const modalBody = document.getElementById('modalBody');
  
  modalBody.innerHTML = `
    <h3 style="margin-top: 0;">تعديل البيانات الشخصية</h3>
    <form id="editProfileForm">
      <label>
        الاسم
        <input type="text" id="editName" value="${user.name}" required />
      </label>
      <label>
        رقم الهاتف
        <input type="tel" id="editPhone" value="${user.phone}" required />
      </label>
      <label>
        المدينة
        <input type="text" id="editCity" value="${user.city}" required />
      </label>
      <label>
        العنوان
        <input type="text" id="editAddress" value="${user.address}" required />
      </label>
      ${user.userType === 'seller' ? `
      <label>
        اسم المصنع
        <input type="text" id="editFactoryName" value="${user.factoryName}" required />
      </label>
      <label>
        المحافظة
        <select id="editGovernorate" required>
          <option value="${user.governorate}">${user.governorate}</option>
          ${GOVERNORATES.filter(g => g !== user.governorate).map(g => `<option value="${g}">${g}</option>`).join('')}
        </select>
      </label>
      ` : ''}
      <div class="card-actions">
        <button type="submit" class="primary-button">حفظ التغييرات</button>
        <button type="button" class="secondary-button" id="cancelEditBtn">إلغاء</button>
      </div>
    </form>
  `;
  
  modal.classList.remove('hidden');
  
  document.getElementById('editProfileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    saveProfileEdits();
  });
  
  document.getElementById('cancelEditBtn').addEventListener('click', closeModal);
}

function saveProfileEdits() {
  const user = getCurrentUser();
  if (!user) return;
  
  const name = document.getElementById('editName').value.trim();
  const phone = document.getElementById('editPhone').value.trim();
  const city = document.getElementById('editCity').value.trim();
  const address = document.getElementById('editAddress').value.trim();
  
  if (!name || !phone || !city || !address) {
    showToast('يرجى تعبئة جميع الحقول');
    return;
  }
  
  const userIndex = state.users.findIndex(u => u.userId === user.userId);
  if (userIndex !== -1) {
    state.users[userIndex].name = name;
    state.users[userIndex].phone = phone;
    state.users[userIndex].city = city;
    state.users[userIndex].address = address;
    
    if (user.userType === 'seller') {
      const factoryName = document.getElementById('editFactoryName').value.trim();
      const governorate = document.getElementById('editGovernorate').value.trim();
      if (factoryName) state.users[userIndex].factoryName = factoryName;
      if (governorate) state.users[userIndex].governorate = governorate;
    }
    
    saveState();
    closeModal();
    renderProfile();
    updateHeaderUserBadge();
    showToast('تم حفظ البيانات بنجاح');
  }
}

function renderAddProductForm() {
  const user = getCurrentUser();
  if (!user || user.userType !== 'seller') {
    setScreen('market');
    return;
  }
}

function renderDashboardSummary() {
  const user = getCurrentUser();
  if (!user || user.userType !== 'seller') return;

  const totalProducts = state.products.filter((product) => product.sellerId === user.userId).length;
  const totalOrders = state.orders.filter((order) => order.sellerId === user.userId).length;
  const acceptedOrders = state.orders.filter((order) => order.sellerId === user.userId && order.status === 'accepted').length;
  const pendingOrders = state.orders.filter((order) => order.sellerId === user.userId && order.status === 'pending').length;
  const soldQuantity = state.orders.filter((order) => order.sellerId === user.userId && order.status === 'accepted').reduce((sum, item) => sum + item.requestedQuantity, 0);
  const revenue = state.orders.filter((order) => order.sellerId === user.userId && order.status === 'accepted').reduce((sum, item) => sum + item.totalPrice, 0);
  const reusedQty = state.products.filter((product) => product.sellerId === user.userId).reduce((sum, item) => sum + item.quantity, 0);

  const dashboardContainer = document.getElementById('seller-dashboard');
  if (!dashboardContainer) return;

  dashboardContainer.innerHTML = `
    <div class="stats-card card"><strong>${totalProducts}</strong><span>منتجات معروضة</span></div>
    <div class="stats-card card"><strong>${totalOrders}</strong><span>إجمالي الطلبات</span></div>
    <div class="stats-card card"><strong>${acceptedOrders}</strong><span>الطلبات المقبولة</span></div>
    <div class="stats-card card"><strong>${pendingOrders}</strong><span>الطلبات المعلقة</span></div>
    <div class="stats-card card"><strong>${soldQuantity} كجم</strong><span>الكمية المباعة</span></div>
    <div class="stats-card card"><strong>${revenue} ج</strong><span>إجمالي الإيرادات</span></div>
    <div class="stats-card card"><strong>${reusedQty} كجم</strong><span>خامات أعيد استخدامها</span></div>
  `;
}

function renderDashboard() {
  const user = getCurrentUser();
  const dashboardWrap = document.getElementById('seller-dashboard');
  if (!dashboardWrap) return;

  if (!user || user.userType !== 'seller') {
    dashboardWrap.innerHTML = '';
    return;
  }

  renderDashboardSummary();
}

function renderSustainabilityCard() {
  const statCard = document.getElementById('sustainabilityStats');
  if (!statCard) return;

  const totalReused = state.products.reduce((sum, product) => sum + product.quantity, 0);
  const totalOperations = state.orders.length;
  const factories = new Set(state.products.map((product) => product.sellerId)).size;

  statCard.innerHTML = `
    <div class="stat-inline"><strong>${totalReused} كجم</strong><span>إجمالي الخامات المعاد استخدامها</span></div>
    <div class="stat-inline"><strong>${totalOperations} عملية</strong><span>عدد عمليات إعادة الاستخدام</span></div>
    <div class="stat-inline"><strong>${factories} مصنع</strong><span>عدد المصانع المشاركة</span></div>
  `;
}

function mapOrderStatus(status) {
  const map = {
    pending: 'قيد الانتظار',
    accepted: 'مقبول',
    rejected: 'مرفوض',
    completed: 'مكتمل',
    cancelled: 'ملغي'
  };
  return map[status] || status;
}

function openProduct(productId) {
  selectedProductId = productId;
  const product = getProductById(productId);
  if (!product) return;

  const user = getCurrentUser();
  const isFavorite = !!state.favorites.find((fav) => fav.userId === user?.userId && fav.productId === product.productId);
  document.getElementById('modalBody').innerHTML = `
    <img class="detail-image" src="${normalizeProductImage(product)}" alt="${product.productName}" />
    <h3>${product.productName}</h3>
    <div class="meta-list">
      <span><label>نوع القماش</label><strong>${product.materialType}</strong></span>
      <span><label>اللون</label><strong>${product.color}</strong></span>
      <span><label>الحالة</label><strong>${product.condition}</strong></span>
      <span><label>الكمية</label><strong>${product.quantity} ${product.unit}</strong></span>
      <span><label>السعر</label><strong>${product.price} جنيه/${product.unit}</strong></span>
      <span><label>المحافظة</label><strong>${product.governorate}</strong></span>
      <span><label>المدينة</label><strong>${product.city}</strong></span>
    </div>
    <p>${product.description}</p>
    <hr />
    <div class="modal-grid">
      <div><label>اسم البائع</label><strong>${getUserById(product.sellerId)?.name || 'غير معروف'}</strong></div>
      <div><label>اسم المصنع</label><strong>${getUserById(product.sellerId)?.factoryName || 'غير معروف'}</strong></div>
    </div>
    <form class="request-form" id="requestForm">
      <label>
        الكمية المطلوبة
        <input type="number" id="requestedQty" min="1" value="1" max="${product.quantity}" required />
      </label>
      <div class="card-actions">
        <button type="button" class="link-button" id="toggleFavoriteBtn">${isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}</button>
        <button type="submit" class="primary-button">طلب الخامة</button>
      </div>
    </form>
  `;

  document.getElementById('productModal').classList.remove('hidden');
  document.getElementById('requestForm').addEventListener('submit', (event) => {
    event.preventDefault();
    submitPurchase(productId);
  });

  const toggleFavoriteBtn = document.getElementById('toggleFavoriteBtn');
  toggleFavoriteBtn.addEventListener('click', () => toggleFavorite(productId));
}

function closeModal() {
  document.getElementById('productModal').classList.add('hidden');
}

function submitPurchase(productId) {
  const user = getCurrentUser();
  if (!user) {
    showToast('يرجى تسجيل الدخول أولاً');
    openAuth('login');
    return;
  }

  const product = getProductById(productId);
  const requestedQty = Number(document.getElementById('requestedQty').value);
  if (!product || requestedQty <= 0 || requestedQty > product.quantity) {
    showToast('الكمية المطلوبة غير صالحة');
    return;
  }

  const order = {
    orderId: `o${Date.now()}`,
    buyerId: user.userId,
    sellerId: product.sellerId,
    productId: product.productId,
    requestedQuantity: requestedQty,
    totalPrice: requestedQty * product.price,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  state.orders.push(order);
  saveState();
  closeModal();
  renderOrders();
  showToast('تم إرسال طلب الشراء بنجاح');
  setScreen('orders');
}

function toggleFavorite(productId) {
  const user = getCurrentUser();
  if (!user) {
    showToast('يرجى تسجيل الدخول أولاً');
    openAuth('login');
    return;
  }

  const existingFavorite = state.favorites.find((fav) => fav.userId === user.userId && fav.productId === productId);
  if (existingFavorite) {
    state.favorites = state.favorites.filter((fav) => fav.favoriteId !== existingFavorite.favoriteId);
    showToast('تم حذف المنتج من المفضلة');
  } else {
    state.favorites.push({
      favoriteId: `f${Date.now()}`,
      userId: user.userId,
      productId,
      createdAt: new Date().toISOString()
    });
    showToast('تمت إضافة المنتج إلى المفضلة');
  }

  saveState();
  renderProducts();
  renderFavorites();
  closeModal();
}

function removeFavorite(productId) {
  const user = getCurrentUser();
  if (!user) return;
  state.favorites = state.favorites.filter((fav) => !(fav.userId === user.userId && fav.productId === productId));
  saveState();
  renderFavorites();
  renderProducts();
}

function updateOrderStatus(orderId, action) {
  const order = state.orders.find((item) => item.orderId === orderId);
  if (!order) return;

  order.status = action === 'accept' ? 'accepted' : 'rejected';
  saveState();
  renderOrders();
  showToast(action === 'accept' ? 'تم قبول الطلب' : 'تم رفض الطلب');
}

function addProduct(event) {
  event.preventDefault();

  const user = getCurrentUser();
  if (!user || user.userType !== 'seller') {
    showToast('يجب أن تكون مسجلاً كـ بائع لإضافة خامة جديدة');
    openAuth('login');
    return;
  }

  const productName = document.getElementById('productName').value.trim();
  const materialType = document.getElementById('materialType').value.trim();
  const color = document.getElementById('productColor').value.trim();
  const condition = document.getElementById('productCondition').value.trim();
  const quantity = Number(document.getElementById('productQuantity').value);
  const unit = document.getElementById('productUnit').value.trim();
  const price = Number(document.getElementById('productPrice').value);
  const governorate = document.getElementById('productGovernorate').value.trim();
  const city = document.getElementById('productCity').value.trim();
  const description = document.getElementById('productDescription').value.trim();
  const imageValue = document.getElementById('productImage').value.trim();

  if (!productName || !materialType || !color || !condition || !quantity || !unit || !price || !governorate || !city || !description) {
    showToast('يرجى تعبئة جميع الحقول المطلوبة');
    return;
  }

  const newProduct = {
    productId: `p${Date.now()}`,
    sellerId: user.userId,
    productName,
    materialType,
    description,
    price,
    quantity,
    unit,
    color,
    condition,
    governorate,
    city,
    images: imageValue ? [imageValue] : [getFabricImage(materialType)],
    status: 'available',
    createdAt: new Date().toISOString()
  };

  state.products.unshift(newProduct);
  saveState();
  event.target.reset();
  showToast('تمت إضافة الخامة بنجاح');
  setScreen('market');
  renderProducts();
}

function attachFormListeners() {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const identifier = document.getElementById('loginIdentifier').value.trim();
      const password = document.getElementById('loginPassword').value.trim();
      loginUser(identifier, password);
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', registerUser);
  }

  const addProductForm = document.getElementById('addProductForm');
  if (addProductForm) {
    addProductForm.addEventListener('submit', addProduct);
  }

  const closeModalButton = document.getElementById('closeModal');
  if (closeModalButton) {
    closeModalButton.addEventListener('click', closeModal);
  }

  const modal = document.getElementById('productModal');
  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target.id === 'productModal') {
        closeModal();
      }
    });
  }
}

function bindEvents() {
  document.addEventListener('click', (event) => {
    const toggleOption = event.target.closest('.toggle-option');
    if (toggleOption) {
      registerType = toggleOption.dataset.userType;
      document.querySelectorAll('.toggle-option').forEach((button) => {
        button.classList.toggle('active', button.dataset.userType === registerType);
      });
      syncRegistrationFields();
      return;
    }

    const screenButton = event.target.closest('[data-screen]');
    if (screenButton) {
      const screen = screenButton.dataset.screen;
      if (screen === 'welcome') {
        setScreen('welcome');
        return;
      }
      const user = getCurrentUser();
      if (!user && screen !== 'welcome') {
        openAuth('login');
        return;
      }
      if (screen === 'market' || screen === 'favorites' || screen === 'orders' || screen === 'profile' || screen === 'add-product') {
        setScreen(screen);
      }
      return;
    }

    const target = event.target.closest('[data-action]');
    if (target) {
      const action = target.dataset.action;
      if (action === 'login') openAuth('login');
      if (action === 'register') openAuth('register');
      if (action === 'toRegister') openAuth('register');
      if (action === 'restore') showToast('سيتم تفعيل استعادة كلمة المرور قريبًا');
      return;
    }

    const productTarget = event.target.closest('[data-open-product]');
    if (productTarget) {
      openProduct(productTarget.dataset.openProduct);
      return;
    }

    const favoriteTarget = event.target.closest('[data-favorite-id]');
    if (favoriteTarget) {
      toggleFavorite(favoriteTarget.dataset.favoriteId);
      return;
    }

    const removeFavoriteTarget = event.target.closest('[data-remove-favorite]');
    if (removeFavoriteTarget) {
      removeFavorite(removeFavoriteTarget.dataset.removeFavorite);
      return;
    }

    const orderActionTarget = event.target.closest('[data-order-action]');
    if (orderActionTarget) {
      const actionValue = orderActionTarget.dataset.orderAction;
      const orderId = orderActionTarget.dataset.orderId;
      updateOrderStatus(orderId, actionValue);
    }
  });

  document.getElementById('logoutBtn').addEventListener('click', logout);
}

function bindNamedButtonHandlers() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  const closeModalButton = document.getElementById('closeModal');
  if (closeModalButton) {
    closeModalButton.addEventListener('click', closeModal);
  }
}

function boot() {
  renderAll();
  bindEvents();
  bindNamedButtonHandlers();
  attachFormListeners();
  renderDashboard();
  renderSustainabilityCard();
  renderProducts();
  fillRegistrationSelectors();
  syncRegistrationFields();
  updateHeaderUserBadge();
  if (state.currentUserId) {
    setScreen('market');
  }
}

const FABRIC_TEXTURES = {
  'جينز': 'https://images.unsplash.com/photo-1582418702059-97d3a45ebc71?auto=format&fit=crop&w=1200&q=80',
  'قطن': 'https://images.unsplash.com/photo-1585071455592-29b46f235cbb?auto=format&fit=crop&w=1200&q=80',
  'كتان': 'https://images.unsplash.com/photo-1578932750146-23c1bef72294?auto=format&fit=crop&w=1200&q=80',
  'صوف': 'https://images.unsplash.com/photo-1577720643272-265e434e2a7a?auto=format&fit=crop&w=1200&q=80',
  'حرير': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80',
  'بوليستر': 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=1200&q=80',
  'فيسكوز': 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=1200&q=80',
  'جبردين': 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1200&q=80',
  'شيفون': 'https://images.unsplash.com/photo-1629840042867-8d651b4db3b3?auto=format&fit=crop&w=1200&q=80',
  'كريب': 'https://images.unsplash.com/photo-1595828128934-c652e4a38e2b?auto=format&fit=crop&w=1200&q=80',
  'ساتان': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80',
  'ليكرا': 'https://images.unsplash.com/photo-1541417904180-f175f6aa1cb7?auto=format&fit=crop&w=1200&q=80',
  'مخمل': 'https://images.unsplash.com/photo-1578932750237-6d9bf1db7ab7?auto=format&fit=crop&w=1200&q=80',
  'جوخ': 'https://images.unsplash.com/photo-1577720643272-265e434e2a7a?auto=format&fit=crop&w=1200&q=80',
  'تول': 'https://images.unsplash.com/photo-1599599810694-b5ac4dd64b13?auto=format&fit=crop&w=1200&q=80',
  'دانتيل': 'https://images.unsplash.com/photo-1567409757898-f4d5c3d36e4d?auto=format&fit=crop&w=1200&q=80',
  'جلد': 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=80',
  'فرو': 'https://images.unsplash.com/photo-1591291621749-f8d6d0ef60d1?auto=format&fit=crop&w=1200&q=80',
  'قماش تنجيد': 'https://images.unsplash.com/photo-1586023492125-111184c6f289?auto=format&fit=crop&w=1200&q=80',
  'Denim': 'https://images.unsplash.com/photo-1582418702059-97d3a45ebc71?auto=format&fit=crop&w=1200&q=80'
};

function getFabricImage(materialType = '') {
  return FABRIC_TEXTURES[materialType] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80';
}

function normalizeProductImage(product) {
  if (!product) return 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80';
  if (product.materialType) return getFabricImage(product.materialType);
  if (Array.isArray(product.images) && product.images.length) return product.images[0];
  return 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80';
}

boot();
