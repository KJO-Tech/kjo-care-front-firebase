# KJO Mind Care - Dashboard de Administración 🧠📊

Este dashboard fue desarrollado como parte del proyecto de bienestar emocional KJO Mind Care. Permite a administradores gestionar los recursos del sistema (blogs, usuarios, categorías, centros de salud, etc.) desde un entorno seguro, intuitivo y moderno. Actualmente, el backend ha sido migrado a Firebase para facilitar el escalado y simplificar la gestión de datos en tiempo real.

## 🛠 Tecnologías Usadas

- Angular 19 (con standalone components)

- Firebase (Auth, Firestore, Storage)

- TailwindCSS + DaisyUI

- OpenLayers (para mapas)

- GitHub Actions (CI/CD)

## 📦 Casos de Uso

| Caso de Uso                    | Descripción                                                   | Rol           |
|:-------------------------------|:--------------------------------------------------------------|:--------------|
| Ver usuarios                   | Lista completa de usuarios registrados                        | Administrador |
| Editar usuario                 | Actualizar nombre, estado o rol de un usuario                 | Administrador |
| Mantener blog                  | Visualizar todos los blogs, crearlos, editarlos y eliminarlos | Administrador |
| Mantener categorías            | Visualizar, crear, editar categorías                          | Administrador |
| Mantener Comentarios           | Visualizar, crear, editar y eliminar comentarios de los blogs | Administrador |
| Mantener centros de salud      | Visualizar, crear, editar y eliminar centros de salud         | Administrador |
| Mantener estados de ánimo      | Visualizar, crear, editar estados de ánimo                    | Administrador |
| Visualizar estadísticas de uso | Panel de métricas del sistema                                 | Administrador |

## 🚀 Características del Dashboard

- CRUD completo para blogs, usuarios, recursos de emergencia y centros de salud.

- Mapa interactivo con OpenLayers para localizar centros de atención cercanos.

- Visualización de métricas sobre el uso de la plataforma (usuarios, blogs, estados de ánimo).

- Integración con Firebase Auth y Firestore.

- Interfaz responsiva y amigable.

## ⚙️ Configuración del proyecto

- Primero clona el repositorio

```bash
git clone https://github.com/KJO-Tech/kjo-care-front
```

- Dirígete al directorio

```bash
cd kjo-care-front
```

[//]: # (- En la raíz del proyecto, crea un archivo .env con el siguiente contenido:)

[//]: # ()
[//]: # (```text)

[//]: # (```)

- Instala las dependencias con Bun

```bash
bun install
```

- Inicia la aplicación de Angular

```bash
ng serve
```

- La aplicación estará disponible en `http://localhost:4200`
