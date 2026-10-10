const STORAGE_KEY = 'dompetku_data_v1';
const THEME_KEY = 'tema_aplikasi';

const $ = (id) => document.getElementById(id);
const dataKosong = () => ({ anggaran: 0, pengeluaran: [] });

let idYangAkanDihapus = null;
let toastTimeout = null;
let state = muatData();

const formatRupiah = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
}).format;

const katConfig = {
    'Makanan & Minuman': { icon: 'fa-burger', color: 'cat-text-orange', bg: 'cat-bg-orange', bar: 'cat-bar-orange' },
    'Transportasi': { icon: 'fa-motorcycle', color: 'cat-text-blue', bg: 'cat-bg-blue', bar: 'cat-bar-blue' },
    'Tugas & Kuliah': { icon: 'fa-book', color: 'cat-text-purple', bg: 'cat-bg-purple', bar: 'cat-bar-purple' },
    'Hiburan': { icon: 'fa-gamepad', color: 'cat-text-pink', bg: 'cat-bg-pink', bar: 'cat-bar-pink' },
    'Lainnya': { icon: 'fa-wallet', color: 'cat-text-gray', bg: 'cat-bg-gray', bar: 'cat-bar-gray' }
};

const getKat = (nama) => katConfig[nama] || katConfig['Lainnya'];
const hitungTotal = () => state.pengeluaran.reduce((sum, item) => sum + item.nominal, 0);

/* ===== Penyimpanan ===== */

function muatData() {
    try {
        const tersimpan = localStorage.getItem(STORAGE_KEY);
        if (!tersimpan) return dataKosong();
        const data = JSON.parse(tersimpan);
        return {
            anggaran: Number(data.anggaran) || 0,
            pengeluaran: Array.isArray(data.pengeluaran) ? data.pengeluaran : []
        };
    } catch {
        return dataKosong();
    }
}

function simpanKePenyimpanan() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        return true;
    } catch {
        showToast('Data gagal disimpan di browser.');
        return false;
    }
}

function dapatkanTanggalSekarang() {
    const hariIni = new Date();
    const dd = String(hariIni.getDate()).padStart(2, '0');
    const mm = String(hariIni.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${hariIni.getFullYear()}`;
}

/* ===== Navigasi & render ===== */

const renderView = {
    'view-dashboard': () => renderDashboard(),
    'view-riwayat': () => renderRiwayat(),
    'view-anggaran': () => renderAnggaran(),
    'view-catat': () => $('form-catat').reset()
};

function navigate(viewId) {
    document.querySelectorAll('.view-section').forEach(view => view.classList.remove('active'));
    $(viewId)?.classList.add('active');
    renderView[viewId]?.();
}

function renderDashboard() {
    const totalPengeluaran = hitungTotal();
    const sisaUang = state.anggaran - totalPengeluaran;

    const sisaElement = $('dash-sisa');
    sisaElement.textContent = formatRupiah(sisaUang);
    $('dash-pengeluaran').textContent = formatRupiah(totalPengeluaran);
    sisaElement.classList.toggle('text-danger-light', sisaUang < 0);
}

function simpanData(e) {
    e.preventDefault();

    const nominal = parseInt($('input-nominal').value, 10);
    if (!(nominal > 0)) return;

    state.pengeluaran.unshift({
        id: Date.now(),
        tanggal: dapatkanTanggalSekarang(),
        nominal,
        kategori: $('input-kategori').value,
        keterangan: $('input-keterangan').value
    });
    if (!simpanKePenyimpanan()) return;

    showToast('Pengeluaran berhasil dicatat!');
    navigate('view-dashboard');
}

function renderRiwayat() {
    const container = $('riwayat-list');
    const tanggalSekarang = dapatkanTanggalSekarang();
    const bulanIni = tanggalSekarang.slice(3); // "mm/yyyy"

    $('riwayat-label-bulan').textContent = tanggalSekarang;

    if (state.pengeluaran.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fa-regular fa-folder-open"></i><p>Belum ada data riwayat tersimpan.</p></div>`;
        $('riwayat-total-bulan').textContent = formatRupiah(0);
        return;
    }

    let totalBulanIni = 0;

    container.innerHTML = state.pengeluaran.map(item => {
        const conf = getKat(item.kategori);
        const [, bulan, tahun, ...sisa] = item.tanggal.split('/');
        if (tahun !== undefined && !sisa.length && `${bulan}/${tahun}` === bulanIni) totalBulanIni += item.nominal;

        return `
            <div onclick="lihatDetail(${item.id})" class="riwayat-item">
                <div class="riwayat-left">
                    <div class="riwayat-icon ${conf.bg} ${conf.color}">
                        <i class="fa-solid ${conf.icon}"></i>
                    </div>
                    <div class="riwayat-title">
                        <h4>${item.kategori}</h4>
                        <p>${item.keterangan || '-'}</p>
                    </div>
                </div>
                <div class="riwayat-right">
                    <p class="nominal">- ${formatRupiah(item.nominal)}</p>
                    <p class="tanggal">${item.tanggal}</p>
                </div>
            </div>
        `;
    }).join('');

    $('riwayat-total-bulan').textContent = formatRupiah(totalBulanIni);
}

function lihatDetail(id) {
    const item = state.pengeluaran.find(x => x.id === id);
    if (!item) return;

    const conf = getKat(item.kategori);
    const iconContainer = $('detail-icon');
    iconContainer.className = `detail-icon ${conf.bg} ${conf.color}`;
    iconContainer.innerHTML = `<i class="fa-solid ${conf.icon}"></i>`;

    $('detail-nominal').textContent = formatRupiah(item.nominal);
    $('detail-kategori').textContent = item.kategori;
    $('detail-tanggal').textContent = item.tanggal;
    $('detail-keterangan').innerText = item.keterangan || '-';

    $('btn-hapus').setAttribute('onclick', `bukaModalHapus(${id})`);
    navigate('view-detail');
}

function bukaModalHapus(id) {
    idYangAkanDihapus = id;
    $('modal-hapus').classList.remove('hidden');
}

function tutupModalHapus() {
    idYangAkanDihapus = null;
    $('modal-hapus').classList.add('hidden');
}

function konfirmasiHapus() {
    if (!idYangAkanDihapus) return;

    state.pengeluaran = state.pengeluaran.filter(item => item.id !== idYangAkanDihapus);
    if (simpanKePenyimpanan()) {
        tutupModalHapus();
        showToast('Transaksi berhasil dihapus!');
        navigate('view-riwayat');
    }
}

function renderAnggaran() {
    const totalPengeluaran = hitungTotal();
    $('anggaran-total').textContent = formatRupiah(state.anggaran);
    $('input-anggaran').value = state.anggaran > 0 ? state.anggaran : '';

    const persentase = state.anggaran > 0 ? Math.min((totalPengeluaran / state.anggaran) * 100, 100) : 0;

    const bar = $('anggaran-bar');
    bar.style.width = `${persentase}%`;
    bar.classList.toggle('over-budget', persentase > 80);
    $('anggaran-persen').textContent = `${Math.round(persentase)}% Terpakai`;

    const perKategori = {};
    state.pengeluaran.forEach(item => {
        perKategori[item.kategori] = (perKategori[item.kategori] || 0) + item.nominal;
    });

    $('kategori-list').innerHTML = Object.keys(katConfig)
        .filter(kat => perKategori[kat] > 0)
        .map(kat => {
            const total = perKategori[kat];
            const conf = katConfig[kat];
            const persenKat = state.anggaran > 0 ? Math.min((total / state.anggaran) * 100, 100) : 0;
            return `
                <div class="kat-item">
                    <div class="kat-item-header">
                        <div class="kat-item-title">
                            <i class="fa-solid ${conf.icon} ${conf.color}"></i>
                            <span>${kat}</span>
                        </div>
                        <span class="kat-item-val">${formatRupiah(total)}</span>
                    </div>
                    <div class="kat-progress-track">
                        <div class="kat-progress-fill ${conf.bar}" style="width: ${persenKat}%"></div>
                    </div>
                </div>
            `;
        }).join('');
}

function simpanAnggaran(e) {
    e?.preventDefault();

    const inputAnggaran = $('input-anggaran');
    const nominalBaru = parseInt(inputAnggaran.value, 10);

    if (!Number.isFinite(nominalBaru) || nominalBaru <= 0) {
        $('anggaran-total').textContent = formatRupiah(state.anggaran);
        showToast('Tolong masukkan nominal anggaran lebih dari Rp 0.');
        inputAnggaran.focus();
        return false;
    }

    state.anggaran = nominalBaru;
    renderAnggaran();
    renderDashboard();

    showToast(simpanKePenyimpanan() ? 'Anggaran Anda berhasil disimpan!' : 'Gagal menyimpan data di browser.');
    return false;
}

/* ===== UI helper ===== */

function showToast(message = 'Data berhasil disimpan!') {
    const toast = $('toast');
    toast.textContent = message;
    toast.className = 'show';

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { toast.className = ''; }, 3000);
}

function pilihKategori(kategori, btnElement) {
    $('input-kategori').value = kategori;
    document.querySelectorAll('.kategori-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
}

function toggleTema() {
    const gelap = document.body.classList.toggle('dark-mode');
    $('ikon-tema').classList.replace(gelap ? 'fa-moon' : 'fa-sun', gelap ? 'fa-sun' : 'fa-moon');
    localStorage.setItem(THEME_KEY, gelap ? 'gelap' : 'terang');
}

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem(THEME_KEY) === 'gelap') {
        document.body.classList.add('dark-mode');
        $('ikon-tema')?.classList.replace('fa-moon', 'fa-sun');
    }

    $('form-anggaran')?.addEventListener('submit', simpanAnggaran);
});

window.onload = renderDashboard;

/* ===== Drag jendela (fullscreen <-> floating) ===== */

const appContainer = $('app-container');
const dragHandle = $('drag-handle');

let isDragging = false;
let isTicking = false;
let startX, startY;
let xOffset = 0;
let yOffset = 0;

const geser = (x, y) => { appContainer.style.transform = `translate3d(${x}px, ${y}px, 0)`; };
const titik = (e) => (e.touches ? e.touches[0] : e);

// Mulai dalam keadaan Fullscreen
appContainer.classList.remove('is-floating');

dragHandle.addEventListener('mousedown', dragStart);
document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', dragEnd);

dragHandle.addEventListener('touchstart', dragStart, { passive: true });
document.addEventListener('touchmove', drag, { passive: false });
document.addEventListener('touchend', dragEnd);

function dragStart(e) {
    const { clientX, clientY } = titik(e);
    startX = clientX - xOffset;
    startY = clientY - yOffset;
    isDragging = true;
}

function drag(e) {
    if (!isDragging) return;
    e.preventDefault();

    const { clientX, clientY } = titik(e);
    const currentX = clientX - startX;
    const currentY = clientY - startY;
    const isFloating = appContainer.classList.contains('is-floating');

    if (!isFloating && currentY > 30) {
        appContainer.classList.add('is-floating');

        xOffset = clientX - 400 / 2;
        yOffset = clientY - 15;
        startX = clientX - xOffset;
        startY = clientY - yOffset;

        geser(xOffset, yOffset);
        return;
    }

    if (isFloating && clientY < 15) {
        appContainer.classList.remove('is-floating');

        xOffset = yOffset = 0;
        startX = clientX;
        startY = clientY;

        geser(0, 0);
        return;
    }

    if (isFloating) {
        xOffset = currentX;
        yOffset = currentY;

        if (!isTicking) {
            isTicking = true;
            requestAnimationFrame(() => {
                geser(xOffset, yOffset);
                isTicking = false;
            });
        }
    }
}

function dragEnd() {
    isDragging = false;
}

/* ===== Service worker ===== */

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker berhasil didaftarkan: ', reg.scope))
            .catch(err => console.log('Pendaftaran Service Worker gagal: ', err));
    });
}

if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('dark-mode');
}
