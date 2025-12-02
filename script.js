// Carga global del catálogo
let catalogoPiezas = [];

// Utilidad: obtener parámetro de la URL
function getParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

// Utilidad: contador de descargas simulado con localStorage
function getDescargas(id) {
    const key = `descargas_${id}`;
    const val = localStorage.getItem(key);
    return val ? parseInt(val, 10) : 0;
}

function incrementarDescargas(id) {
    const key = `descargas_${id}`;
    const current = getDescargas(id);
    localStorage.setItem(key, current + 1);
    return current + 1;
}

/* -------- Inicialización general -------- */

document.addEventListener("DOMContentLoaded", async () => {
    // Menú móvil
    const navToggle = document.getElementById("navToggle");
    const mainNav = document.getElementById("mainNav");

    if (navToggle && mainNav) {
        navToggle.addEventListener("click", () => {
            mainNav.classList.toggle("open");
        });
    }

    // Cargar catálogo
    try {
        const res = await fetch("catalogo.json");
        catalogoPiezas = await res.json();

        // Si estamos en index.html, renderizar catálogo
        if (document.getElementById("catalogoGrid")) {
            inicializarCatalogo();
        }

        // Si estamos en pieza.html, renderizar ficha
        if (document.getElementById("pieza-detalle")) {
            inicializarFichaPieza();
        }
    } catch (error) {
        console.error("Error al cargar catalogo.json", error);
    }
});

/* -------- FUNCIONES PARA EL CATÁLOGO (index.html) -------- */

function inicializarCatalogo() {
    const searchInput = document.getElementById("searchInput");
    const filterCategoria = document.getElementById("filterCategoria");
    const filterTipo = document.getElementById("filterTipo");
    const filterMaterial = document.getElementById("filterMaterial");
    const filterCompatibilidad = document.getElementById("filterCompatibilidad");

    // Llenar filtros con valores únicos del catálogo
    poblarSelectUnicos(filterCategoria, "categoria");
    poblarSelectUnicos(filterTipo, "tipo_pieza");
    poblarSelectUnicos(filterMaterial, "material_recomendado");
    poblarSelectUnicos(filterCompatibilidad, "compatibilidad");

    function aplicarFiltros() {
        const termino = searchInput.value.toLowerCase().trim();
        const cat = filterCategoria.value;
        const tipo = filterTipo.value;
        const mat = filterMaterial.value;
        const comp = filterCompatibilidad.value;

        const filtradas = catalogoPiezas.filter((pieza) => {
            const matchTexto =
                pieza.nombre.toLowerCase().includes(termino) ||
                (pieza.descripcion_corta || "").toLowerCase().includes(termino) ||
                (pieza.tipo_pieza || "").toLowerCase().includes(termino);

            const matchCat = !cat || pieza.categoria === cat;
            const matchTipo = !tipo || pieza.tipo_pieza === tipo;
            const matchMat = !mat || pieza.material_recomendado === mat;
            const matchComp = !comp || pieza.compatibilidad === comp;

            return matchTexto && matchCat && matchTipo && matchMat && matchComp;
        });

        renderizarCatalogo(filtradas);
    }

    searchInput.addEventListener("input", aplicarFiltros);
    filterCategoria.addEventListener("change", aplicarFiltros);
    filterTipo.addEventListener("change", aplicarFiltros);
    filterMaterial.addEventListener("change", aplicarFiltros);
    filterCompatibilidad.addEventListener("change", aplicarFiltros);

    // Render inicial
    renderizarCatalogo(catalogoPiezas);
}

function poblarSelectUnicos(selectEl, campo) {
    const valores = new Set();
    catalogoPiezas.forEach((pieza) => {
        if (pieza[campo]) valores.add(pieza[campo]);
    });

    [...valores].sort().forEach((valor) => {
        const opt = document.createElement("option");
        opt.value = valor;
        opt.textContent = valor;
        selectEl.appendChild(opt);
    });
}

function renderizarCatalogo(piezas) {
    const grid = document.getElementById("catalogoGrid");
    grid.innerHTML = "";

    if (!piezas.length) {
        grid.innerHTML = "<p>No se encontraron piezas con los criterios seleccionados.</p>";
        return;
    }

    piezas.forEach((pieza) => {
        const card = document.createElement("article");
        card.className = "card card-piece";

        const img = document.createElement("img");
        img.src = pieza.imagen_principal || "img/placeholder-modelo.png";
        img.alt = `Vista previa de ${pieza.nombre}`;

        const header = document.createElement("div");
        header.className = "card-piece-header";
        const title = document.createElement("div");
        title.className = "card-piece-title";
        title.textContent = pieza.nombre;

        const subtitle = document.createElement("div");
        subtitle.className = "card-piece-subtitle";
        subtitle.textContent = pieza.descripcion_corta || pieza.tipo_pieza || "";

        const tags = document.createElement("div");
        tags.className = "card-piece-tags";
        if (pieza.categoria) {
            const b = document.createElement("span");
            b.className = "badge badge-primary";
            b.textContent = pieza.categoria;
            tags.appendChild(b);
        }
        if (pieza.material_recomendado) {
            const b = document.createElement("span");
            b.className = "badge";
            b.textContent = pieza.material_recomendado;
            tags.appendChild(b);
        }
        if (pieza.compatibilidad) {
            const b = document.createElement("span");
            b.className = "badge";
            b.textContent = pieza.compatibilidad;
            tags.appendChild(b);
        }

        header.appendChild(title);
        if (subtitle.textContent) header.appendChild(subtitle);
        header.appendChild(tags);

        // Acciones y contador
        const footer = document.createElement("div");
        footer.className = "card-piece-footer";

        const actions = document.createElement("div");
        actions.className = "card-piece-actions";

        const linkFicha = document.createElement("a");
        linkFicha.className = "btn btn-outline";
        linkFicha.textContent = "Ver ficha";
        linkFicha.href = `pieza.html?id=${encodeURIComponent(pieza.id)}`;

        const linkDescarga = document.createElement("a");
        linkDescarga.className = "btn btn-primary";
        linkDescarga.textContent = "Descargar modelo";
        linkDescarga.href = pieza.archivo_modelo;
        linkDescarga.setAttribute("download", "");

        // Actualizar contador de descargas (simulación)
        const counter = document.createElement("span");
        counter.className = "download-counter";
        counter.textContent = `Descargas simuladas: ${getDescargas(pieza.id)}`;

        linkDescarga.addEventListener("click", () => {
            const nuevas = incrementarDescargas(pieza.id);
            counter.textContent = `Descargas simuladas: ${nuevas}`;
        });

        actions.appendChild(linkFicha);
        actions.appendChild(linkDescarga);

        footer.appendChild(actions);
        footer.appendChild(counter);

        card.appendChild(img);
        card.appendChild(header);
        card.appendChild(footer);

        grid.appendChild(card);
    });
}

/* -------- FUNCIONES PARA FICHA DE PIEZA (pieza.html) -------- */

function inicializarFichaPieza() {
    const contenedor = document.getElementById("pieza-detalle");
    const id = getParam("id");

    if (!id) {
        contenedor.innerHTML = "<p>No se especificó ninguna pieza.</p>";
        return;
    }

    const pieza = catalogoPiezas.find((p) => p.id === id);
    if (!pieza) {
        contenedor.innerHTML = "<p>No se encontró la pieza solicitada en el catálogo.</p>";
        return;
    }

    document.title = `${pieza.nombre} - Ficha de pieza médica`;

    // Construcción de layout
    const layout = document.createElement("div");
    layout.className = "pieza-layout";

    /* Columna principal: imagen + descripción + CNC + advertencias */

    const main = document.createElement("div");
    main.className = "pieza-main";

    const titulo = document.createElement("h2");
    titulo.textContent = pieza.nombre;

    const subtitulo = document.createElement("p");
    subtitulo.className = "muted small";
    subtitulo.textContent = pieza.descripcion_corta || "";

    // Galería
    const galleryMain = document.createElement("div");
    galleryMain.className = "pieza-gallery-main";
    const imgMain = document.createElement("img");
    imgMain.src = pieza.imagen_principal || "img/placeholder-modelo.png";
    imgMain.alt = `Modelo 3D de ${pieza.nombre}`;
    galleryMain.appendChild(imgMain);

    const galleryThumbs = document.createElement("div");
    galleryThumbs.className = "pieza-gallery-thumbs";

    const imagenes = pieza.galeria && pieza.galeria.length
        ? pieza.galeria
        : [pieza.imagen_principal || "img/placeholder-modelo.png"];

    imagenes.forEach((src, index) => {
        const thumb = document.createElement("img");
        thumb.src = src;
        thumb.alt = `Vista ${index + 1} de ${pieza.nombre}`;
        if (index === 0) thumb.classList.add("active");
        thumb.addEventListener("click", () => {
            imgMain.src = src;
            [...galleryThumbs.querySelectorAll("img")].forEach((i) =>
                i.classList.remove("active")
            );
            thumb.classList.add("active");
        });
        galleryThumbs.appendChild(thumb);
    });

    const descTitulo = document.createElement("h3");
    descTitulo.textContent = "Descripción técnica";

    const descParrafo = document.createElement("p");
    descParrafo.textContent =
        pieza.descripcion_larga ||
        "Modelo 3D de pieza médica diseñado para fabricación mediante mecanizado CNC, con geometría optimizada para minimizar tiempos de proceso y garantizar la integridad dimensional de la zona de interés clínica.";

    const cncTitulo = document.createElement("h3");
    cncTitulo.textContent = "Indicaciones para fabricación CNC";

    const cncLista = document.createElement("ul");
    (pieza.indicaciones_cnc || []).forEach((step) => {
        const li = document.createElement("li");
        li.textContent = step;
        cncLista.appendChild(li);
    });

    if (!pieza.indicaciones_cnc || !pieza.indicaciones_cnc.length) {
        const li = document.createElement("li");
        li.textContent =
            "Importar el archivo STL al software CAM, generar la trayectoria en tres ejes con herramienta de diámetro apropiado y verificar que las zonas críticas mantengan las tolerancias requeridas.";
        cncLista.appendChild(li);
    }

    const advertTitulo = document.createElement("h3");
    advertTitulo.textContent = "Advertencias de seguridad";

    const advertParrafo = document.createElement("p");
    advertParrafo.className = "small";
    advertParrafo.textContent =
        pieza.advertencias ||
        "Este modelo se proporciona únicamente con fines académicos y de investigación. No debe utilizarse directamente en pacientes sin validación experimental, clínica y regulatoria conforme a la normativa aplicable.";

    const acciones = document.createElement("div");
    acciones.style.marginTop = "1rem";
    acciones.style.display = "flex";
    acciones.style.flexWrap = "wrap";
    acciones.style.gap = "0.6rem";

    const btnVolver = document.createElement("a");
    btnVolver.href = "index.html#catalogo";
    btnVolver.className = "btn btn-outline";
    btnVolver.textContent = "← Volver al catálogo";

    const btnDescargar = document.createElement("a");
    btnDescargar.href = pieza.archivo_modelo;
    btnDescargar.className = "btn btn-primary";
    btnDescargar.setAttribute("download", "");
    btnDescargar.textContent = "Descargar modelo 3D";

    const counter = document.createElement("span");
    counter.className = "download-counter";
    counter.textContent = `Descargas simuladas: ${getDescargas(pieza.id)}`;
    counter.style.alignSelf = "center";

    btnDescargar.addEventListener("click", () => {
        const nuevas = incrementarDescargas(pieza.id);
        counter.textContent = `Descargas simuladas: ${nuevas}`;
    });

    acciones.appendChild(btnVolver);
    acciones.appendChild(btnDescargar);
    acciones.appendChild(counter);

    main.appendChild(titulo);
    if (subtitulo.textContent) main.appendChild(subtitulo);
    main.appendChild(galleryMain);
    main.appendChild(galleryThumbs);
    main.appendChild(descTitulo);
    main.appendChild(descParrafo);
    main.appendChild(cncTitulo);
    main.appendChild(cncLista);
    main.appendChild(advertTitulo);
    main.appendChild(advertParrafo);
    main.appendChild(acciones);

    /* Columna lateral: metadatos y validación */

    const meta = document.createElement("aside");
    meta.className = "pieza-meta";

    const hMetadatos = document.createElement("h3");
    hMetadatos.textContent = "Ficha técnica";

    const tabla = document.createElement("table");

    function fila(label, valor) {
        if (!valor) return;
        const tr = document.createElement("tr");
        const th = document.createElement("th");
        const td = document.createElement("td");
        th.textContent = label;
        td.textContent = valor;
        tr.appendChild(th);
        tr.appendChild(td);
        tabla.appendChild(tr);
    }

    fila("Categoría", pieza.categoria);
    fila("Tipo de pieza", pieza.tipo_pieza);
    fila("Compatibilidad", pieza.compatibilidad);
    fila("Material recomendado", pieza.material_recomendado);
    fila("Formato de archivo", pieza.formato || "STL");
    fila(
        "Proceso CNC",
        pieza.procesos_cnc && pieza.procesos_cnc.length
            ? pieza.procesos_cnc.join(", ")
            : "Fresado CNC en 3 ejes"
    );

    meta.appendChild(hMetadatos);
    meta.appendChild(tabla);

    const hVal = document.createElement("h3");
    hVal.textContent = "Notas sobre validación";

    const valP = document.createElement("p");
    valP.className = "small";
    valP.textContent =
        pieza.validacion ||
        "Modelo verificado geométricamente en entorno CAD. La validación experimental, mecánica y clínica debe realizarse antes de cualquier uso en pacientes.";

    meta.appendChild(hVal);
    meta.appendChild(valP);

    layout.appendChild(main);
    layout.appendChild(meta);

    contenedor.innerHTML = "";
    contenedor.appendChild(layout);
}
