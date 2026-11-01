from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from sqlmodel import SQLModel, Field, Relationship, create_engine, Session, select

# Tabla intermedia: cada fila relaciona un producto con una categoría.
class ProductoCategoria(SQLModel, table=True):
    __tablename__ = "productos_categorias"

    producto_id: int = Field(foreign_key="producto.id", primary_key=True)
    categoria_id: int = Field(foreign_key="categoria.id", primary_key=True)


# Modelo de la tabla de productos
class Producto(SQLModel, table=True):
    """
    Datos del producto guardados en la base de datos
    """
    id: int | None = Field(default=None, primary_key=True)
    nombre: str
    descripcion: str
    precio: float = Field(ge=0)
    stock: int = Field(ge=0)
    imagen: str | None = None
    categorias: list["Categoria"] = Relationship(back_populates="productos", link_model=ProductoCategoria)
    
# Datos para registrar un producto
class ProductoCreate(SQLModel):
    """
    Datos necesarios para crear un producto
    """
    nombre: str
    descripcion: str
    precio: float = Field(ge=0)
    stock: int = Field(ge=0)
    imagen: str | None = None

# Vinculo entre categoria y producto
class CategoriaProductoRead(SQLModel):
    id: int
    name: str


class ProductoRead(ProductoCreate):
    """
    Datos del producto que devuelve la API, incluyendo su id
    """
    id: int
    categorias: list[CategoriaProductoRead] = Field(default_factory=list)

# Categorías y sus productos relacionados.
class Categoria(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    nombre: str
    productos: list[Producto] = Relationship(back_populates="categorias", link_model=ProductoCategoria)


class CategoriaCreate(SQLModel):
    nombre: str = Field(min_length=1)


class CategoriaRead(CategoriaCreate):
    id: int


# Preparar la respuesta mientras la sesión de base de datos sigue abierta.
def producto_con_categorias(producto: Producto):
    return ProductoRead(
        id=producto.id,
        nombre=producto.nombre,
        descripcion=producto.descripcion,
        precio=producto.precio,
        stock=producto.stock,
        imagen=producto.imagen,
        categorias=[CategoriaProductoRead(id=categoria.id, name=categoria.nombre)
                    for categoria in producto.categorias],
    )


# Ruta de la base de datos SQLite
directorio_backend = Path(__file__).resolve().parent
sqlite_url = f"sqlite:///{directorio_backend / 'tienda.db'}"

# Crear la conexión con la base de datos
engine = create_engine(
    sqlite_url, 
    echo=True,
    connect_args={"check_same_thread": False},
)

app = FastAPI(title="API de productos")
app.mount("/imagenes", StaticFiles(directory=directorio_backend / "imagenes"), name="imagenes")

# Permitir solicitudes desde el servidor local del frontend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://localhost:5501",
        "http://127.0.0.1:5500",
        "http://127.0.0.1:5501",
    ],
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type"],
)



@app.on_event("startup")
def crear_tablas():
    """
    Crear las tablas al iniciar la API si todavía no existen
    """
    SQLModel.metadata.create_all(engine)

@app.get("/")
def read_root():
    """
    Mostrar el mensaje de inicio y la ruta de la documentación
    """
    return {"mensaje": "API de productos", "documentacion": "/docs"}


@app.post("/productos/", status_code=status.HTTP_201_CREATED, response_model=ProductoRead)
def crear_producto(datos: ProductoCreate):
    """
    Registrar un producto en la base de datos
    """
    producto = Producto(
        nombre=datos.nombre,
        descripcion=datos.descripcion,
        precio=datos.precio,
        stock=datos.stock,
        imagen=datos.imagen,
    )
    with Session(engine) as session:
        session.add(producto)
        session.commit()
        session.refresh(producto)
        return producto_con_categorias(producto)


@app.get("/productos/", response_model=list[ProductoRead])
def obtener_productos():
    """
    Obtener todos los productos ordenados por id
    """
    with Session(engine) as session:
        productos = session.exec(select(Producto).order_by(Producto.id)).all()
        return [producto_con_categorias(producto) for producto in productos]


@app.get("/productos/{id}", response_model=ProductoRead)
def obtener_producto(id: int):
    """
    Obtener producto por id
    """
    with Session(engine) as session:
        producto = session.get(Producto, id)
        if producto is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
        return producto_con_categorias(producto)


@app.delete("/productos/{id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_producto(id: int):
    """
    Eliminar un producto por id
    """
    with Session(engine) as session:
        producto = session.get(Producto, id)
        if producto is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
        # Buscar los vínculos del producto con sus categorías.
        vinculos = session.exec(
            select(ProductoCategoria).where(ProductoCategoria.producto_id == id)
        ).all()

        # Borrar cada vínculo antes de eliminar el producto.
        for vinculo in vinculos:
            session.delete(vinculo)
        session.flush()

        session.delete(producto)
        session.commit()
    return


# Endpoints de categorías, siguiendo el mismo estilo de productos.
@app.post("/categorias/", status_code=status.HTTP_201_CREATED, response_model=CategoriaRead)
def crear_categoria(datos: CategoriaCreate):
    nombre = datos.nombre.strip()
    if not nombre:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="El nombre es obligatorio")
    categoria = Categoria(nombre=nombre)
    with Session(engine) as session:
        session.add(categoria)
        session.commit()
        session.refresh(categoria)
        return categoria


@app.get("/categorias/", response_model=list[CategoriaRead])
def obtener_categorias():
    with Session(engine) as session:
        return session.exec(select(Categoria).order_by(Categoria.id)).all()


@app.get("/categorias/{id}", response_model=CategoriaRead)
def obtener_categoria(id: int):
    with Session(engine) as session:
        categoria = session.get(Categoria, id)
        if categoria is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")
        return categoria


@app.delete("/categorias/{id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_categoria(id: int):
    with Session(engine) as session:
        categoria = session.get(Categoria, id)
        if categoria is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")
        # Buscar los vínculos de la categoría con sus productos.
        vinculos = session.exec(
            select(ProductoCategoria).where(ProductoCategoria.categoria_id == id)
        ).all()

        # Borrar cada vínculo antes de eliminar la categoría.
        for vinculo in vinculos:
            session.delete(vinculo)
        session.flush()

        session.delete(categoria)
        session.commit()


# Consultar las categorías de un producto.
@app.get("/productos/{id}/categorias/", response_model=list[CategoriaRead])
def obtener_categorias_producto(id: int):
    with Session(engine) as session:
        producto = session.get(Producto, id)
        if producto is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
        return producto.categorias


# Relacionar un producto existente con una categoría existente.
@app.post("/productos/{id}/categorias/{categoria_id}", status_code=status.HTTP_201_CREATED, response_model=CategoriaRead)
def agregar_categoria_producto(id: int, categoria_id: int):
    with Session(engine) as session:
        producto = session.get(Producto, id)
        categoria = session.get(Categoria, categoria_id)
        if producto is None or categoria is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto o categoría no encontrado")
        if categoria in producto.categorias:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El producto ya tiene esta categoría")
        producto.categorias.append(categoria)
        session.add(producto)
        session.commit()
        session.refresh(categoria)
        return categoria


# Quitar solo la asociación, sin borrar el producto ni la categoría.
@app.delete("/productos/{id}/categorias/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT)
def quitar_categoria_producto(id: int, categoria_id: int):
    with Session(engine) as session:
        producto = session.get(Producto, id)
        categoria = session.get(Categoria, categoria_id)
        if producto is None or categoria is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto o categoría no encontrado")
        if categoria not in producto.categorias:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="El producto no tiene esta categoría")
        producto.categorias.remove(categoria)
        session.add(producto)
        session.commit()


@app.get("/categorias/{id}/productos/", response_model=list[ProductoRead])
def obtener_productos_categoria(id: int):
    with Session(engine) as session:
        categoria = session.get(Categoria, id)
        if categoria is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")
        return [producto_con_categorias(producto) for producto in categoria.productos]
