# Desarrollo de una tienda web con Fetch y FastAPI

## Instrucciones

### 1. Backend: gestión de productos

Ampliar la API desarrollada en la actividad anterior para gestionar productos.

Crear un modelo `Producto` utilizando SQLModel con los siguientes atributos:

- `id`: identificador autogenerado.
- `nombre`: nombre del producto.
- `descripcion`: descripción del producto.
- `precio`: precio del producto.
- `stock`: cantidad disponible.

Implementar los siguientes endpoints:

| Método | Endpoint          | Funcionalidad                  |
| ------ | ----------------- | ------------------------------ |
| POST   | `/productos/`     | Registrar un producto.         |
| GET    | `/productos/`     | Consultar todos los productos. |
| GET    | `/productos/{id}` | Consultar un producto por ID.  |
| DELETE | `/productos/{id}` | Eliminar un producto.          |

### 2. Frontend: desarrollo de la tienda

Crear una interfaz web utilizando HTML y CSS que represente una tienda sencilla.

La interfaz deberá incluir:

- Catálogo de productos: mostrar los productos disponibles en tarjetas con nombre, descripción y precio.
- Registro de productos: formulario para ingresar nuevos productos.
- Consulta de productos: permitir buscar un producto por su identificador.
- Eliminación de productos: incorporar un botón para eliminar productos del catálogo.

### 3. Consumo de la API con Fetch

Utilizar JavaScript y `fetch()` para conectar el frontend con FastAPI.

Se deberá implementar:

- Solicitudes GET para obtener los productos.
- Solicitudes POST para registrar productos.
- Solicitudes GET para consultar productos individuales.
- Solicitudes DELETE para eliminar productos.

El catálogo deberá actualizarse automáticamente después de registrar o eliminar un producto.

## Proyecto

El proyecto es una tienda web sencilla. Permite registrar, consultar y eliminar productos y categorías. La página usa JavaScript y `fetch()` para enviar y recibir datos del backend.

### Frontend

La carpeta `Frontend` contiene las páginas y el diseño de la tienda.

- `index.html`: página principal con el catálogo y las opciones para gestionar productos.
- `categorias.html`: página para gestionar las categorías.
- `styles.css`: define los colores, tamaños y la presentación de las páginas.
- `scripts.js`: maneja las acciones de los productos y la conexión con el backend.
- `categorias.js`: maneja las acciones de las categorías y la conexión con el backend.
- `assets/images/`: guarda las imágenes usadas en la página, como el logo y la imagen de ejemplo de un producto.

### Backend

La carpeta `Backend` contiene el código que recibe las solicitudes de la página y guarda los datos.

- `main.py`: contiene la aplicación FastAPI, los modelos de datos y las funciones para gestionar productos, categorías y sus vínculos.
- `requirements.txt`: lista las librerías que se necesitan para ejecutar el backend.
- `tienda.db`: base de datos donde se guardan los productos, las categorías y sus vínculos.
- `imagenes/`: guarda las imágenes de los productos.

## Instalación

### Frontend

Para ejecutar el frontend usamos el plugin de VS Code [Live Server++](https://github.com/ritwickdey/vscode-live-server-plus-plus).

1. Abrir la carpeta `Frontend` en VS Code.
2. Tener instalado el plugin Live Server++.
3. Hacer clic en `Go Live++` para iniciar el servidor y abrir `index.html` en el navegador.

### Backend

El backend usa Python y FastAPI. Primero debemos tener Python instalado.

Desde la carpeta del proyecto, abrir una terminal y entrar a `Backend`:

```bash
cd Backend
```

Instalar las librerías necesarias:

```bash
pip install -r requirements.txt
```

Iniciar el backend con este comando:

```bash
uvicorn main:app --reload
```

El backend se ejecuta en `http://127.0.0.1:8000`. Debemos dejarlo encendido mientras usamos la página.
