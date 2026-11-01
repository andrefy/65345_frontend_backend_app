console.log('Start Store JS');

const URL_API = '//127.0.0.1:8000';
const URL_API_PRODUCTOS = `${URL_API}/productos/`;
const IMAGEN_PLACEHOLDER = "assets/images/producto-placeholder.png";
const container_productos = document.getElementById("productos");

// El mensaje es opcional y no debe interrumpir las operaciones con la API.
const mostrarEstadoProducto = (mensaje) => {
  const estado = document.getElementById('estado-producto');
  if (estado) {
    estado.textContent = mensaje;
  }
};

fetch(URL_API_PRODUCTOS)
  .then(response => response.json())
  .then(productos => {
    productos.forEach(producto => {
      addCard(producto);
      console.log(producto);
    });
  })
  ;

const addCard = (producto) => {
  const card_container = document.createElement("li");
  card_container.dataset.id = producto.id;

  const article = document.createElement("article");
  article.className = "product-card";
  article.setAttribute("aria-labelledby", `producto-${producto.id}`);

  const image_container = document.createElement("div");
  image_container.className = "product-image";
  image_container.setAttribute("aria-hidden", "true");

  const el_img = document.createElement("img");
  if (!producto.imagen || producto.imagen === IMAGEN_PLACEHOLDER) {
    el_img.src = IMAGEN_PLACEHOLDER;
  } else {
    el_img.src = `${URL_API}${producto.imagen}`;
  }
  el_img.alt = "";
  image_container.appendChild(el_img);

  const info = document.createElement("div");
  info.className = "product-info";

  const title = document.createElement("h3");
  title.id = `producto-${producto.id}`;
  title.textContent = producto.nombre;

  const description = document.createElement("p");
  description.className = "description";
  description.textContent = producto.descripcion;

  const price = document.createElement("p");
  price.className = "price";

  const price_label = document.createElement("span");
  price_label.textContent = "Precio: ";

  const currency = document.createElement("span");
  currency.className = "currency";
  currency.textContent = "USD";
  price.append(price_label, `$${Number(producto.precio).toFixed(2)} `, currency);

  const stock = document.createElement("p");
  stock.className = "stock";
  stock.textContent = `Stock: ${producto.stock}`;

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const delete_button = document.createElement("button");
  delete_button.type = "button";
  delete_button.className = "button btn-delete";
  delete_button.setAttribute("data-delete", "");
  delete_button.setAttribute("aria-label", `Eliminar ${producto.nombre}`);
  delete_button.textContent = "Eliminar";
  delete_button.addEventListener("click", () => removeCard(producto, card_container, delete_button));

  const botonCategorias = document.createElement("button");
  botonCategorias.type = "button";
  botonCategorias.className = "btn-producto-categorias";
  botonCategorias.textContent = "Agrega Categoria";
  botonCategorias.setAttribute("aria-label", `Agregar categorías a ${producto.nombre}`);
  botonCategorias.addEventListener("click", () => mostrarCategoriasProducto(producto, card_container));

  actions.append(botonCategorias, delete_button);
  info.appendChild(title);

  // Mostrar una etiqueta pequeña por cada categoría del producto.
  if (producto.categorias && producto.categorias.length > 0) {
    const categorias = document.createElement("ul");
    categorias.className = "product-categories";
    categorias.setAttribute("aria-label", "Categorías del producto");

    producto.categorias.forEach(categoria => {
      const etiqueta = document.createElement("li");
      const botonCategoria = document.createElement("button");
      botonCategoria.type = "button";
      botonCategoria.className = "categoria-pill";
      botonCategoria.textContent = categoria.name;
      botonCategoria.setAttribute("aria-label", `Quitar categoría ${categoria.name} de ${producto.nombre}`);
      botonCategoria.addEventListener("click", () => {
        return quitarCategoriaProducto(producto, categoria, etiqueta, botonCategoria);
      });
      etiqueta.appendChild(botonCategoria);
      categorias.appendChild(etiqueta);
    });

    info.appendChild(categorias);
  }

  info.append(description, price, stock, actions);
  article.append(image_container, info);
  card_container.appendChild(article);
  container_productos.appendChild(card_container);
  return card_container;
}

// Eliminar solo la relación: el producto y la categoría siguen existiendo.
const quitarCategoriaProducto = async (producto, categoria, etiqueta, boton) => {
  if (boton.disabled) return;
  boton.disabled = true;

  try {
    const response = await fetch(`${URL_API_PRODUCTOS}${producto.id}/categorias/${categoria.id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('No se pudo quitar la categoría del producto.');
    }

    const lista = etiqueta.parentElement;
    const siguiente = etiqueta.nextElementSibling || etiqueta.previousElementSibling;
    const botonEliminar = etiqueta.closest('.product-card').querySelector('[data-delete]');
    etiqueta.remove();
    producto.categorias = producto.categorias.filter(item => item.id !== categoria.id);

    if (siguiente) {
      siguiente.querySelector('button').focus();
    } else {
      lista.remove();
      botonEliminar.focus();
    }
    mostrarEstadoProducto(`Categoría ${categoria.name} quitada de ${producto.nombre}.`);
  } catch (error) {
    mostrarEstadoProducto('No se pudo quitar la categoría. Comprueba la conexión con la API e intenta de nuevo.');
    console.error(error);
  } finally {
    boton.disabled = false;
  }
};

const removeCard = async (producto, card, button) => {
  if (button.disabled) return;

  mostrarEstadoProducto('');
  button.disabled = true;
  button.textContent = 'Eliminando…';

  try {
    const response = await fetch(`${URL_API_PRODUCTOS}${producto.id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('No se pudo eliminar el producto.');
    }

    // DELETE devuelve 204 sin contenido; no hace falta llamar a response.json().
    const siguiente = card.nextElementSibling || card.previousElementSibling;
    card.remove();
    mostrarEstadoProducto(`${producto.nombre} eliminado correctamente.`);

    if (siguiente) {
      siguiente.querySelector('[data-delete]').focus();
    } else {
      document.getElementById('btn-add-product').focus();
    }
  } catch (err) {
    mostrarEstadoProducto('No se pudo eliminar el producto. Comprueba la conexión con la API e intenta de nuevo.');
    console.error(err);
  } finally {
    button.disabled = false;
    button.textContent = 'Eliminar';
  }
}

const showAddProducto = () => {
  const dialog = document.getElementById('dialog-add-producto');
  document.getElementById('form-error').textContent = '';
  mostrarEstadoProducto('');
  dialog.showModal();
}

// Los dos botones de agregar abren el mismo diálogo.
const btnsAdd = document.querySelectorAll('[data-add]');
btnsAdd.forEach(button => {
  button.addEventListener('click', showAddProducto);
});

// Cerrar el diálogo sin enviar el formulario.
const btnsClose = document.querySelectorAll('[data-close]');
btnsClose.forEach(button => {
  button.addEventListener('click', () => {
    document.getElementById('dialog-add-producto').close();
  });
});

// Enviar los datos como JSON y devolver el producto guardado por la API.
const guardarProducto = async (producto) => {
  const response = await fetch(URL_API_PRODUCTOS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(producto)
  });

  if (!response.ok) {
    throw new Error('No se pudo guardar el producto. Revisa los datos e intenta de nuevo.');
  }

  return response.json();
};

const onSubmitAddProducto = async (event) => {
  event.preventDefault();
  const form = document.getElementById('producto-form');
  const button = document.getElementById('btn-save-producto');
  const error = document.getElementById('form-error');
  error.textContent = '';

  // Evitar envíos repetidos mientras esperamos la respuesta.
  if (button.disabled || !form.reportValidity()) return;

  const producto = {
    nombre: form.elements.nombre.value.trim(),
    descripcion: form.elements.descripcion.value.trim(),
    precio: form.elements.precio.valueAsNumber,
    stock: form.elements.stock.valueAsNumber,
    imagen: IMAGEN_PLACEHOLDER
  };

  if (!producto.nombre || !producto.descripcion) {
    error.textContent = 'Escribe un nombre y una descripción.';
    return;
  }
  if (!Number.isFinite(producto.precio) || producto.precio < 0 ||
      !Number.isInteger(producto.stock) || producto.stock < 0) {
    error.textContent = 'El precio debe ser un número no negativo y el stock un entero no negativo.';
    return;
  }

  button.disabled = true;
  button.textContent = 'Guardando…';

  try {
    const guardado = await guardarProducto(producto);
    addCard(guardado);
    form.reset();
    document.getElementById('dialog-add-producto').close();
    mostrarEstadoProducto('Producto registrado correctamente.');
  } catch (err) {
    error.textContent = 'No se pudo completar el registro. Comprueba que la API esté disponible e intenta de nuevo.';
    console.error(err);
  } finally {
    button.disabled = false;
    button.textContent = 'Guardar producto';
  }
};

const productoForm = document.getElementById('producto-form');
productoForm.addEventListener('submit', onSubmitAddProducto);

// Buscar un producto cuando se envía el formulario.
const buscarProductoPorId = async (event) => {
  event.preventDefault();

  const input = document.getElementById('busqueda');
  const valor = input.value.trim();
  const id = Number(valor);

  if (valor === '' || !Number.isSafeInteger(id) || id <= 0) {
    alert('Ingresa un ID válido: un número entero mayor que cero.');
    return;
  }

  const button = document.querySelector('.search button');
  if (button.disabled) return;
  button.disabled = true;

  try {
    const response = await fetch(`${URL_API_PRODUCTOS}${id}`, {
      method: 'GET'
    });

    if (response.status === 404) {
      alert('No se encontró un producto con ese ID.');
      return;
    }

    if (!response.ok) {
      throw new Error('No se pudo consultar el producto.');
    }

    const producto = await response.json();

    // Borrar las tarjetas anteriores y reutilizar la función que ya tenemos.
    container_productos.textContent = '';
    addCard(producto);
    mostrarEstadoProducto('Producto encontrado.');
  } catch (error) {
    alert('No se pudo buscar el producto. Comprueba la conexión con la API.');
    console.error(error);
  } finally {
    button.disabled = false;
  }
};

const searchForm = document.querySelector('.search');
searchForm.addEventListener('submit', buscarProductoPorId);


// Abrir el formulario al llegar desde el menú de categorías.
if (window.location.hash === '#nuevo-producto') {
  showAddProducto();
}


// Producto y tarjeta que se están editando en el diálogo de categorías.
let productoCategoriasActual = null;
let tarjetaCategoriasActual = null;
let guardandoCategorias = false;
const dialogProductoCategorias = document.getElementById('dialog-producto-categorias');
const listaProductoCategorias = document.getElementById('lista-producto-categorias');
const errorProductoCategorias = document.getElementById('error-producto-categorias');
const btnGuardarCategorias = document.getElementById('btn-save-producto-categorias');
const camposProductoCategorias = document.getElementById('campos-producto-categorias');

const mostrarCategoriasProducto = async (producto, tarjeta) => {
  productoCategoriasActual = producto;
  tarjetaCategoriasActual = tarjeta;
  listaProductoCategorias.textContent = '';
  errorProductoCategorias.textContent = '';
  document.getElementById('producto-categorias-ayuda').textContent = `Cargando categorías de ${producto.nombre}…`;
  btnGuardarCategorias.disabled = true;
  dialogProductoCategorias.showModal();

  try {
    const responseCategorias = await fetch(`${URL_API}/categorias/`);
    const responseProducto = await fetch(`${URL_API_PRODUCTOS}${producto.id}`);
    if (!responseCategorias.ok || !responseProducto.ok) {
      throw new Error('No se pudieron cargar las categorías.');
    }
    const categorias = await responseCategorias.json();
    const actualizado = await responseProducto.json();
    if (!dialogProductoCategorias.open) return;

    categorias.forEach(categoria => {
      const fila = document.createElement('li');
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = categoria.id;
      checkbox.name = 'categorias';
      checkbox.checked = actualizado.categorias.some(item => item.id === categoria.id);
      label.append(checkbox, ` ${categoria.nombre}`);
      fila.appendChild(label);
      listaProductoCategorias.appendChild(fila);
    });

    document.getElementById('producto-categorias-ayuda').textContent = categorias.length === 0
      ? 'No hay categorías disponibles. Puedes crearlas desde el menú Categorías.'
      : `Selecciona las categorías de ${producto.nombre}. Puedes dejar todas sin marcar.`;
    btnGuardarCategorias.disabled = false;
  } catch (error) {
    errorProductoCategorias.textContent = 'No se pudieron cargar las categorías. Cierra el diálogo e intenta de nuevo.';
    console.error(error);
  }
};

// Volver a consultar el producto para que las pills reflejen la base de datos.
const actualizarTarjetaCategorias = async () => {
  const response = await fetch(`${URL_API_PRODUCTOS}${productoCategoriasActual.id}`);
  if (!response.ok) {
    throw new Error('No se pudo actualizar la tarjeta.');
  }
  const actualizado = await response.json();
  const nuevaTarjeta = addCard(actualizado);
  tarjetaCategoriasActual.replaceWith(nuevaTarjeta);
  tarjetaCategoriasActual = nuevaTarjeta;
  productoCategoriasActual = actualizado;
};

const guardarCategoriasProducto = async (event) => {
  event.preventDefault();
  if (guardandoCategorias || btnGuardarCategorias.disabled) return;

  // Guardar la selección antes de deshabilitar los checkboxes.
  const seleccionadas = [];
  listaProductoCategorias.querySelectorAll('input:checked').forEach(checkbox => {
    seleccionadas.push(Number(checkbox.value));
  });

  guardandoCategorias = true;
  btnGuardarCategorias.disabled = true;
  btnGuardarCategorias.textContent = 'Guardando…';
  camposProductoCategorias.disabled = true;
  errorProductoCategorias.textContent = '';

  try {
    const id = productoCategoriasActual.id;
    const response = await fetch(`${URL_API_PRODUCTOS}${id}`);
    if (!response.ok) {
      throw new Error('No se pudo consultar el producto.');
    }
    const producto = await response.json();

    // Primero quitar todas las asociaciones actuales, una por una.
    for (const categoria of producto.categorias) {
      const eliminado = await fetch(`${URL_API_PRODUCTOS}${id}/categorias/${categoria.id}`, {
        method: 'DELETE'
      });
      if (!eliminado.ok) {
        throw new Error('No se pudo quitar una categoría.');
      }
    }

    // Después crear las asociaciones seleccionadas, una por una.
    for (const categoriaId of seleccionadas) {
      const creado = await fetch(`${URL_API_PRODUCTOS}${id}/categorias/${categoriaId}`, {
        method: 'POST'
      });
      if (!creado.ok) {
        throw new Error('No se pudo agregar una categoría.');
      }
    }

    await actualizarTarjetaCategorias();
    dialogProductoCategorias.close();
    tarjetaCategoriasActual.querySelector('.btn-producto-categorias').focus();
    mostrarEstadoProducto('Categorías del producto actualizadas.');
  } catch (error) {
    errorProductoCategorias.textContent = 'No se completó el guardado. Algunas asociaciones pueden haber cambiado. Intenta guardar de nuevo.';
    console.error(error);
    // Si hubo un error a mitad del proceso, mostrar el estado que quedó guardado.
    try {
      await actualizarTarjetaCategorias();
    } catch (errorActualizacion) {
      console.error(errorActualizacion);
    }
  } finally {
    guardandoCategorias = false;
    btnGuardarCategorias.disabled = false;
    btnGuardarCategorias.textContent = 'Guardar categorías';
    camposProductoCategorias.disabled = false;
  }
};

document.getElementById('producto-categorias-form').addEventListener('submit', guardarCategoriasProducto);
document.querySelectorAll('[data-close-producto-categorias]').forEach(boton => {
  boton.addEventListener('click', () => {
    if (!guardandoCategorias) dialogProductoCategorias.close();
  });
});

// Evitar cerrar con Escape mientras se están cambiando las asociaciones.
dialogProductoCategorias.addEventListener('cancel', event => {
  if (guardandoCategorias) event.preventDefault();
});
