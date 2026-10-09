const STORAGE_KEY = 'dompetku_data_v1';
const dataAwal = { anggaran: 0, pengeluaran: [] };
let idYangAkanDihapus = null;
let toastTimeout = null; 
let state = muatData();

const formatterRupiah = new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    minimumFractionDigits: 0 
});

const formatRupiah = (angka) => formatterRupiah.format(angka);

function muatData() {
    try {
        const tersimpan = localStorage.getItem(STORAGE_KEY);
        if (!tersimpan) return { ...dataAwal, pengeluaran: [] };
        const data = JSON.parse(tersimpan);
        return {
            anggaran: Number(data.anggaran) || 0,
            pengeluaran: Array.isArray(data.pengeluaran) ? data.pengeluaran : []
        };
    } catch (error) {
        return { ...dataAwal, pengeluaran: [] };
    }
}

function simpanKePenyimpanan() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        return true;
    } catch (error) {
        showToast('Data gagal disimpan di browser.');
        return false;
    }
}

function dapatkanTanggalSekarang() {
    const hariIni = new Date();
    const dd = String(hariIni.getDate()).padStart(2, '0');
    const mm = String(hariIni.getMonth() + 1).padStart(2, '0');
    const yyyy = hariIni.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

const katConfig = {
    'Makanan & Minuman': { icon: 'fa-burger', color: 'cat-text-orange', bg: 'cat-bg-orange', bar: 'cat-bar-orange' },
    'Transportasi': { icon: 'fa-motorcycle', color: 'cat-text-blue', bg: 'cat-bg-blue', bar: 'cat-bar-blue' },
    'Tugas & Kuliah': { icon: 'fa-book', color: 'cat-text-purple', bg: 'cat-bg-purple', bar: 'cat-bar-purple' },
    'Hiburan': { icon: 'fa-gamepad', color: 'cat-text-pink', bg: 'cat-bg-pink', bar: 'cat-bar-pink' },
    'Lainnya': { icon: 'fa-wallet', color: 'cat-text-gray', bg: 'cat-bg-gray', bar: 'cat-bar-gray' }
};

function navigate(viewId) {
    document.querySelectorAll('.view-section').forEach(view => {
        view.classList.remove('active');
    });
    
    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.add('active');

    if (viewId === 'view-dashboard') renderDashboard();
    else if (viewId === 'view-riwayat') renderRiwayat();
    else if (viewId === 'view-anggaran') renderAnggaran();
    else if (viewId === 'view-catat') document.getElementById('form-catat').reset();
}

function renderDashboard() {
    const totalPengeluaran = state.pengeluaran.reduce((sum, item) => sum + item.nominal, 0);
    const sisaUang = state.anggaran - totalPengeluaran;

    const sisaElement = document.getElementById('dash-sisa');
    sisaElement.innerText = formatRupiah(sisaUang);
    document.getElementById('dash-pengeluaran').innerText = formatRupiah(totalPengeluaran);
    
    if (sisaUang < 0) {
        sisaElement.classList.add('text-danger-light');
    } else {
        sisaElement.classList.remove('text-danger-light');
    }
}

function simpanData(e) {
    e.preventDefault();
    
    const nominalStr = document.getElementById('input-nominal').value;
    const kategori = document.getElementById('input-kategori').value;
    const keterangan = document.getElementById('input-keterangan').value;
    
    const nominalAngka = parseInt(nominalStr, 10);
    if (!nominalAngka || nominalAngka <= 0) return;

    const newData = {
        id: Date.now(),
        tanggal: dapatkanTanggalSekarang(),
        nominal: nominalAngka,
        kategori: kategori,
        keterangan: keterangan
    };

    state.pengeluaran.unshift(newData);
    if (!simpanKePenyimpanan()) return;

    showToast("Pengeluaran berhasil dicatat!");
    navigate('view-dashboard');
}

function renderRiwayat() {
    const container = document.getElementById('riwayat-list');
    
    const hariIni = new Date();
    const mm = String(hariIni.getMonth() + 1).padStart(2, '0');
    const yyyy = hariIni.getFullYear();
    const bulanIniStr = `${mm}/${yyyy}`;
    
    document.getElementById('riwayat-label-bulan').innerText = dapatkanTanggalSekarang();

    if (state.pengeluaran.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fa-regular fa-folder-open"></i><p>Belum ada data riwayat tersimpan.</p></div>`;
        document.getElementById('riwayat-total-bulan').innerText = formatRupiah(0);
        return;
    }

    let totalBulanIni = 0;
    
    const riwayatHTML = state.pengeluaran.map(item => {
        const conf = katConfig[item.kategori] || katConfig['Lainnya'];
        const parts = item.tanggal.split('/');
        
        if (parts.length === 3) {
            const itemBulanTahun = `${parts[1]}/${parts[2]}`;
            if (itemBulanTahun === bulanIniStr) totalBulanIni += item.nominal;
        }
        
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
    
    container.innerHTML = riwayatHTML;
    document.getElementById('riwayat-total-bulan').innerText = formatRupiah(totalBulanIni);
}

function lihatDetail(id) {
    const item = state.pengeluaran.find(x => x.id === id);
    if (item) {
        const conf = katConfig[item.kategori] || katConfig['Lainnya'];
        
        const iconContainer = document.getElementById('detail-icon');
        iconContainer.className = `detail-icon ${conf.bg} ${conf.color}`;
        iconContainer.innerHTML = `<i class="fa-solid ${conf.icon}"></i>`;
        
        document.getElementById('detail-nominal').innerText = formatRupiah(item.nominal);
        document.getElementById('detail-kategori').innerText = item.kategori;
        document.getElementById('detail-tanggal').innerText = item.tanggal;
        document.getElementById('detail-keterangan').innerText = item.keterangan || '-';
        
        document.getElementById('btn-hapus').setAttribute('onclick', `bukaModalHapus(${id})`);
        navigate('view-detail');
    }
}

function bukaModalHapus(id) {
    idYangAkanDihapus = id;
    document.getElementById('modal-hapus').classList.remove('hidden');
}

function tutupModalHapus() {
    idYangAkanDihapus = null;
    document.getElementById('modal-hapus').classList.add('hidden');
}

function konfirmasiHapus() {
    if (idYangAkanDihapus) {
        state.pengeluaran = state.pengeluaran.filter(item => item.id !== idYangAkanDihapus);
        if (simpanKePenyimpanan()) {
            tutupModalHapus();
            showToast("Transaksi berhasil dihapus!");
            navigate('view-riwayat');
        }
    }
}

function renderAnggaran() {
    const totalPengeluaran = state.pengeluaran.reduce((sum, item) => sum + item.nominal, 0);
    document.getElementById('anggaran-total').innerText = formatRupiah(state.anggaran);
    document.getElementById('input-anggaran').value = state.anggaran > 0 ? state.anggaran : '';
    
    let persentase = state.anggaran > 0 ? (totalPengeluaran / state.anggaran) * 100 : 0;
    if (persentase > 100) persentase = 100;
    
    const bar = document.getElementById('anggaran-bar');
    bar.style.width = `${persentase}%`;
    
    if (persentase > 80) bar.classList.add('over-budget');
    else bar.classList.remove('over-budget');
    
    document.getElementById('anggaran-persen').innerText = `${Math.round(persentase)}% Terpakai`;

    const perKategori = {};
    state.pengeluaran.forEach(item => {
        perKategori[item.kategori] = (perKategori[item.kategori] || 0) + item.nominal;
    });

    const katContainer = document.getElementById('kategori-list');
    
    const kategoriHTML = Object.keys(katConfig).map(kat => {
        const total = perKategori[kat] || 0;
        if (total > 0) {
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
        }
        return '';
    }).join('');
    
    katContainer.innerHTML = kategoriHTML;
}

function simpanAnggaran(e) {
    if (e) e.preventDefault();

    const inputAnggaran = document.getElementById('input-anggaran');
    const outputAnggaran = document.getElementById('anggaran-total');
    const nominalBaru = parseInt(inputAnggaran.value, 10);

    if (!Number.isFinite(nominalBaru) || nominalBaru <= 0) {
        outputAnggaran.textContent = formatRupiah(state.anggaran);
        showToast('Tolong masukkan nominal anggaran lebih dari Rp 0.');
        inputAnggaran.focus();
        return false;
    }

    state.anggaran = nominalBaru;
    outputAnggaran.textContent = formatRupiah(nominalBaru);
    inputAnggaran.value = String(nominalBaru);

    renderAnggaran();
    renderDashboard();

    const berhasil = simpanKePenyimpanan();
    showToast(berhasil ? 'Anggaran Anda berhasil disimpan!' : 'Gagal menyimpan data di browser.');
    return false;
}

function showToast(message = "Data berhasil disimpan!") {
    const toast = document.getElementById("toast");
    toast.innerText = message;
    toast.className = "show";
    
    if (toastTimeout) clearTimeout(toastTimeout);
    
    toastTimeout = setTimeout(() => { 
        toast.className = toast.className.replace("show", ""); 
    }, 3000);
}

function pilihKategori(kategori, btnElement) {
    document.getElementById('input-kategori').value = kategori;
    
    document.querySelectorAll('.kategori-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    btnElement.classList.add('active');
}

function toggleTema() {
    const body = document.body;
    const ikonTema = document.getElementById('ikon-tema');
    
    body.classList.toggle('dark-mode');
    
    if (body.classList.contains('dark-mode')) {
        ikonTema.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('tema_aplikasi', 'gelap');
    } else {
        ikonTema.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('tema_aplikasi', 'terang');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const temaTersimpan = localStorage.getItem('tema_aplikasi');
    const ikonTema = document.getElementById('ikon-tema');
    
    if (temaTersimpan === 'gelap') {
        document.body.classList.add('dark-mode');
        if (ikonTema) {
            ikonTema.classList.replace('fa-moon', 'fa-sun');
        }
    }
    
    const formAnggaran = document.getElementById('form-anggaran');
    if (formAnggaran) {
        formAnggaran.addEventListener('submit', simpanAnggaran);
    }
});

window.onload = function() {
    renderDashboard();
};

const appContainer = document.getElementById('app-container');
const dragHandle = document.getElementById('drag-handle');

let isDragging = false;
let initialX, initialY;
let xOffset = 0, yOffset = 0;

dragHandle.addEventListener('mousedown', dragStart);
document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', dragEnd);

dragHandle.addEventListener('touchstart', dragStart, {passive: true});
document.addEventListener('touchmove', drag, {passive: false});
document.addEventListener('touchend', dragEnd);

function dragStart(e) {
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

    initialX = clientX - xOffset;
    initialY = clientY - yOffset;
    isDragging = true;
}

function drag(e) {
    if (isDragging) {
        e.preventDefault(); 
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

        xOffset = clientX - initialX;
        yOffset = clientY - initialY;

        appContainer.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0)`;
    }
}

function dragEnd() {
    isDragging = false;
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => {
        console.log('Service Worker berhasil didaftarkan: ', reg.scope);
      })
      .catch((err) => {
        console.log('Pendaftaran Service Worker gagal: ', err);
      });
  });
}