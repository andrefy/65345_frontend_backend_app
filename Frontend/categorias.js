console.log('Start Categorias JS');

const URL_API_CATEGORIAS = 'http://127.0.0.1:8000/categorias/';
const tablaCategorias = document.getElementById('categorias');
const dialogCategoria = document.getElementById('dialog-add-categoria');
const categoriaForm = document.getElementById('categoria-form');
const estadoCategorias = document.getElementById('estado-categorias');
const categoriaError = document.getElementById('categoria-error');

// Mostrar un aviso cuando la tabla no tiene filas.
const revisarTabla = () => {
  document.getElementById('sin-categorias').hidden = tablaCategorias.children.length > 0;
};

// Crear una fila usando elementos HTML, sin innerHTML.
const agregarFila = (categoria) => {
  const fila = document.createElement('tr');
  const celdaId = document.createElement('td');
  celdaId.textContent = categoria.id;

  const celdaNombre = document.createElement('td');
  celdaNombre.textContent = categoria.nombre;

  const celdaAcciones = document.createElement('td');
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'btn-delete';
  boton.textContent = 'Eliminar';
  boton.setAttribute('aria-label', `Eliminar categoría ${categoria.nombre}`);
  boton.addEventListener('click', () => eliminarCategoria(categoria, fila, boton));

  celdaAcciones.appendChild(boton);
  fila.append(celdaId, celdaNombre, celdaAcciones);
  tablaCategorias.appendChild(fila);
};

// Consultar las categorías guardadas en el backend.
const cargarCategorias = async () => {
  estadoCategorias.textContent = 'Cargando categorías…';
  try {
    const response = await fetch(URL_API_CATEGORIAS);
    if (!response.ok) {
      throw new Error('No se pudieron cargar las categorías.');
    }
    const categorias = await response.json();
    tablaCategorias.textContent = '';
    categorias.forEach(categoria => agregarFila(categoria));
    revisarTabla();
    estadoCategorias.textContent = 'Categorías cargadas.';
  } catch (error) {
    estadoCategorias.textContent = 'No se pudieron cargar las categorías. Comprueba la conexión con la API.';
    console.error(error);
  }
};

const mostrarNuevaCategoria = () => {
  categoriaError.textContent = '';
  dialogCategoria.showModal();
  document.getElementById('nombre-categoria').focus();
};

// Guardar la categoría y agregar su fila después de recibir la respuesta.
const guardarCategoria = async (event) => {
  event.preventDefault();
  const boton = document.getElementById('btn-save-categoria');
  categoriaError.textContent = '';
  if (boton.disabled || !categoriaForm.reportValidity()) return;

  const nombre = document.getElementById('nombre-categoria').value.trim();
  if (nombre === '') {
    categoriaError.textContent = 'Escribe el nombre de la categoría.';
    return;
  }

  boton.disabled = true;
  boton.textContent = 'Guardando…';
  try {
    const response = await fetch(URL_API_CATEGORIAS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nombre })
    });
    if (!response.ok) {
      throw new Error('No se pudo guardar la categoría.');
    }
    const categoria = await response.json();
    agregarFila(categoria);
    revisarTabla();
    categoriaForm.reset();
    dialogCategoria.close();
    estadoCategorias.textContent = 'Categoría registrada correctamente.';
  } catch (error) {
    categoriaError.textContent = 'No se pudo guardar la categoría. Revisa la conexión con la API e intenta de nuevo.';
    console.error(error);
  } finally {
    boton.disabled = false;
    boton.textContent = 'Guardar categoría';
  }
};

// Borrar la fila únicamente cuando la API confirme la eliminación.
const eliminarCategoria = async (categoria, fila, boton) => {
  if (boton.disabled) return;
  boton.disabled = true;
  boton.textContent = 'Eliminando…';
  try {
    const response = await fetch(`${URL_API_CATEGORIAS}${categoria.id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error('No se pudo eliminar la categoría.');
    }
    const siguiente = fila.nextElementSibling || fila.previousElementSibling;
    fila.remove();
    revisarTabla();
    estadoCategorias.textContent = `${categoria.nombre} eliminada correctamente.`;
    if (siguiente) {
      siguiente.querySelector('button').focus();
    } else {
      document.getElementById('btn-add-categoria').focus();
    }
  } catch (error) {
    estadoCategorias.textContent = 'No se pudo eliminar la categoría. Comprueba la conexión con la API.';
    console.error(error);
  } finally {
    boton.disabled = false;
    boton.textContent = 'Eliminar';
  }
};

const botonesAgregar = document.querySelectorAll('[data-add-categoria]');
botonesAgregar.forEach(boton => {
  boton.addEventListener('click', mostrarNuevaCategoria);
});

const botonesCerrar = document.querySelectorAll('[data-close-categoria]');
botonesCerrar.forEach(boton => {
  boton.addEventListener('click', () => dialogCategoria.close());
});

categoriaForm.addEventListener('submit', guardarCategoria);

// El enlace de la página de productos puede abrir directamente el diálogo.
if (window.location.hash === '#nueva-categoria') {
  mostrarNuevaCategoria();
}

cargarCategorias();
