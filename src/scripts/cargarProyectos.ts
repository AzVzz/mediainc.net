// Carga proyectos de mediainc desde la API y los renderiza con carrusel cuando hay
// más de una imagen. Usado por las páginas /proyectos/{editorial,digital,distribution}.

const API_URL = "https://admin.residente.mx/api/mediainc";
const IMG_BASE = "https://residente.mx";

interface ImagenGaleria {
  id: number;
  url: string;
  orden: number;
}

interface Proyecto {
  id: number;
  titulo: string;
  descripcion?: string | null;
  categoria?: string | null;
  imagen?: string | null;
  link?: string | null;
  fecha_proyecto?: string | null;
  imagenes?: ImagenGaleria[];
}

function srcAbsoluta(url: string): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${IMG_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

function escapeHtml(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function listaImagenes(proyecto: Proyecto): string[] {
  const portada = proyecto.imagen ? srcAbsoluta(proyecto.imagen) : null;
  const galeria = Array.isArray(proyecto.imagenes)
    ? [...proyecto.imagenes]
        .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
        .map((img) => srcAbsoluta(img.url))
        .filter(Boolean)
    : [];

  const todas = portada ? [portada, ...galeria] : galeria;
  return Array.from(new Set(todas));
}

function bloqueImagen(imgs: string[], titulo: string): string {
  if (imgs.length === 0) return "";
  const altSeguro = escapeHtml(titulo);

  if (imgs.length === 1) {
    return `<div class="flex-shrink-0">
      <img src="${imgs[0]}" alt="${altSeguro}" class="w-[650px] h-[500px] object-cover max-w-full" loading="lazy" />
    </div>`;
  }

  const slides = imgs
    .map(
      (src, i) => `<img
        src="${src}"
        alt="${altSeguro}"
        class="carousel-slide absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${i === 0 ? "opacity-100" : "opacity-0"}"
        data-index="${i}"
        loading="${i === 0 ? "eager" : "lazy"}"
      />`
    )
    .join("");

  return `<div class="flex-shrink-0">
    <div class="carousel relative w-[650px] h-[500px] max-w-full overflow-hidden" data-interval="4000">
      <div class="carousel-track relative w-full h-full">${slides}</div>
      <button type="button" class="carousel-prev absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white text-xl cursor-pointer transition-colors" aria-label="Anterior">‹</button>
      <button type="button" class="carousel-next absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white text-xl cursor-pointer transition-colors" aria-label="Siguiente">›</button>
    </div>
  </div>`;
}

function initCarousel(root: HTMLElement) {
  const slides = Array.from(
    root.querySelectorAll<HTMLImageElement>(".carousel-slide")
  );
  if (slides.length <= 1) return;

  const prev = root.querySelector<HTMLButtonElement>(".carousel-prev");
  const next = root.querySelector<HTMLButtonElement>(".carousel-next");
  const interval = Number(root.dataset.interval) || 4000;

  let current = 0;
  let timer: number | undefined;

  const show = (i: number) => {
    current = (i + slides.length) % slides.length;
    slides.forEach((s, idx) => {
      s.classList.toggle("opacity-100", idx === current);
      s.classList.toggle("opacity-0", idx !== current);
    });
  };

  const start = () => {
    stop();
    timer = window.setInterval(() => show(current + 1), interval);
  };
  const stop = () => {
    if (timer) window.clearInterval(timer);
    timer = undefined;
  };

  prev?.addEventListener("click", () => {
    show(current - 1);
    start();
  });
  next?.addEventListener("click", () => {
    show(current + 1);
    start();
  });

  root.addEventListener("mouseenter", stop);
  root.addEventListener("mouseleave", start);

  start();
}

export async function cargarProyectos(
  containerId: string,
  categoria: string
): Promise<void> {
  const lista = document.getElementById(containerId);
  if (!lista) return;

  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Error al cargar");
    const todos: Proyecto[] = await res.json();
    const proyectos = todos.filter((p) => p.categoria === categoria);

    if (proyectos.length === 0) return;

    lista.innerHTML = proyectos
      .map((p) => {
        const imgs = listaImagenes(p);
        const tituloSeguro = escapeHtml(p.titulo);
        const fecha = p.fecha_proyecto
          ? new Date(p.fecha_proyecto).toLocaleDateString("es-MX", {
              year: "numeric",
              month: "long",
            })
          : "";

        return `
        <li class="flex flex-col md:flex-row gap-6 border-b border-white/10 pb-10 last:border-b-0">
          ${bloqueImagen(imgs, p.titulo)}
          <div class="${imgs.length > 0 ? "md:w-3/5" : "w-full"} flex flex-col justify-center">
            <h3 class="text-[25px] font-bold text-white leading-[1.05] notranslate" translate="no">${tituloSeguro}</h3>
            ${fecha ? `<time class="mt-1 text-xs text-[#B5B5B5] uppercase tracking-wider">${fecha}</time>` : ""}
            ${p.descripcion ? `<p class="mt-3 text-[#B5B5B5] leading-[1.3] text-sm md:text-base">${escapeHtml(p.descripcion)}</p>` : ""}
            ${p.link ? `<a href="${p.link}" target="_blank" rel="noopener noreferrer" class="mt-4 text-xs uppercase tracking-widest text-white border-b border-white/40 hover:border-white self-start">Ver proyecto →</a>` : ""}
          </div>
        </li>`;
      })
      .join("");

    lista
      .querySelectorAll<HTMLElement>(".carousel")
      .forEach((root) => initCarousel(root));
  } catch (err) {
    console.error(err);
  }
}
