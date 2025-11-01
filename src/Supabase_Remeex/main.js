// Supabase_Remeex - integración básica con Supabase usando supabase-js v2.
// ------------------------------------------------------------------------
// Pasos recomendados en Supabase (realizar en app.supabase.com):
// 1. Crear tabla "users" con columnas: id (uuid, default uuid_generate_v4(), PK),
//    name (text, requerido) y email (text, requerido, unique). Activa Row Level Security.
// 2. Crear bucket de Storage (por ejemplo "user-files") con visibilidad privada.
// 3. Políticas de RLS sugeridas (SQL):
//    -- Permitir inserts desde el frontend (anon) en la tabla users
//    create policy "Allow anon insert" on public.users
//      for insert with check (true);
//    -- Permitir selects para leer desde el frontend
//    create policy "Allow anon read" on public.users
//      for select using (true);
//    Storage: crear políticas en el bucket "user-files" para permitir insert y read
//    a rol anon limitando por carpeta. Ejemplo (ajusta bucket_id si difiere):
//    -- Insertar archivos en carpeta con el correo del usuario
//    create policy "Allow anon upload" on storage.objects
//      for insert with check (
//        bucket_id = 'user-files' and auth.role() = 'anon'
//      );
//    -- Listar/leer archivos subidos
//    create policy "Allow anon read" on storage.objects
//      for select using (
//        bucket_id = 'user-files' and auth.role() = 'anon'
//      );
//    También puedes añadir validaciones para asegurar que cada usuario sólo acceda a su carpeta.
// ------------------------------------------------------------------------

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://ewdkxszfkqwlkyszodxu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3ZGt4c3pma3F3bGt5c3pvZHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3ODM5MzMsImV4cCI6MjA3NzM1OTkzM30.alofRt3MEn5UgSsSMk5zWTF0On1PGVepdME-MOoqk-M";
const STORAGE_BUCKET = "user-files"; // Ajusta si usas un nombre diferente.

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function sanitizeStorageFolder(value) {
  return value.replace(/[^a-z0-9@._-]/gi, "_");
}

// Elementos del DOM
const registerForm = document.getElementById("register-form");
const registerMessage = document.getElementById("register-message");
const uploadForm = document.getElementById("upload-form");
const uploadMessage = document.getElementById("upload-message");
const refreshButton = document.getElementById("refresh-button");
const adminMessage = document.getElementById("admin-message");
const usersList = document.getElementById("users-list");

function showMessage(element, message, type = "") {
  element.textContent = message;
  element.classList.remove("error", "success");
  if (type) {
    element.classList.add(type);
  }
}

// Utilidad para validar correos simples.
function isValidEmail(value) {
  return /.+@.+\..+/.test(value);
}

registerForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(registerForm);
  const name = formData.get("name")?.toString().trim() ?? "";
  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";

  if (!name) {
    showMessage(registerMessage, "Ingresa un nombre válido.", "error");
    return;
  }

  if (!isValidEmail(email)) {
    showMessage(registerMessage, "Ingresa un correo válido.", "error");
    return;
  }

  const { error } = await supabase.from("users").insert({ name, email });

  if (error) {
    console.error("Error al registrar usuario", error);
    showMessage(registerMessage, `Error: ${error.message}`, "error");
    return;
  }

  registerForm.reset();
  showMessage(registerMessage, "Usuario registrado correctamente.", "success");
});

uploadForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(uploadForm);
  const email = formData.get("upload-email")?.toString().trim().toLowerCase() ?? "";
  const file = formData.get("file");

  if (!isValidEmail(email)) {
    showMessage(uploadMessage, "Ingresa un correo válido.", "error");
    return;
  }

  if (!(file instanceof File)) {
    showMessage(uploadMessage, "Selecciona un archivo.", "error");
    return;
  }

  const allowedTypes = [
    "image/",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!allowedTypes.some((type) => file.type.startsWith(type))) {
    showMessage(
      uploadMessage,
      "Archivo no permitido. Usa imágenes, PDF o documentos Word.",
      "error"
    );
    return;
  }

  // Verificar que el usuario exista para vincular el archivo.
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, email")
    .eq("email", email)
    .maybeSingle();

  if (userError) {
    console.error("Error al buscar usuario", userError);
    showMessage(uploadMessage, `Error: ${userError.message}`, "error");
    return;
  }

  if (!user) {
    showMessage(uploadMessage, "No existe un usuario con ese correo.", "error");
    return;
  }

  const sanitizedEmail = sanitizeStorageFolder(email);
  const filePath = `${sanitizedEmail}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      metadata: {
        user_id: user.id,
        user_email: user.email,
      },
    });

  if (uploadError) {
    console.error("Error al subir archivo", uploadError);
    showMessage(uploadMessage, `Error: ${uploadError.message}`, "error");
    return;
  }

  uploadForm.reset();
  showMessage(uploadMessage, "Archivo subido correctamente.", "success");
});

refreshButton?.addEventListener("click", async () => {
  await loadUsersAndFiles();
});

async function loadUsersAndFiles() {
  showMessage(adminMessage, "Cargando usuarios...", "");
  usersList.innerHTML = "";

  const { data: users, error } = await supabase.from("users").select("id, name, email");

  if (error) {
    console.error("Error al obtener usuarios", error);
    showMessage(adminMessage, `Error: ${error.message}`, "error");
    return;
  }

  if (!users?.length) {
    showMessage(adminMessage, "No hay usuarios registrados todavía.");
    return;
  }

  showMessage(adminMessage, "Usuarios cargados.", "success");

  for (const user of users) {
    const userItem = document.createElement("li");
    userItem.className = "user-card";

    const filesList = document.createElement("ul");

    const folder = sanitizeStorageFolder(user.email);
    const { data: files, error: filesError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(folder, {
        limit: 100,
        offset: 0,
      });

    if (filesError) {
      console.error(`Error al listar archivos para ${user.email}`, filesError);
    }

    if (Array.isArray(files) && files.length) {
      for (const file of files) {
        const listItem = document.createElement("li");
        const link = document.createElement("a");
        const filePath = `${folder}/${file.name}`;

        // Genera un enlace firmado válido por una hora. Para buckets públicos
        // puedes usar getPublicUrl en su lugar.
        const { data: signedUrl } = await supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(filePath, 3600);

        if (signedUrl?.signedUrl) {
          link.href = signedUrl.signedUrl;
          link.target = "_blank";
          link.rel = "noopener";
          link.textContent = file.name;
        } else {
          link.textContent = `${file.name} (sin URL accesible)`;
        }

        listItem.appendChild(link);
        filesList.appendChild(listItem);
      }
    } else {
      const emptyItem = document.createElement("li");
      emptyItem.textContent = "Sin archivos.";
      filesList.appendChild(emptyItem);
    }

    userItem.innerHTML = `
      <div><strong>Nombre:</strong> ${user.name}</div>
      <div><strong>Correo:</strong> ${user.email}</div>
    `;

    const filesTitle = document.createElement("div");
    filesTitle.style.marginTop = "0.75rem";
    filesTitle.style.fontWeight = "600";
    filesTitle.textContent = "Archivos";

    userItem.appendChild(filesTitle);
    userItem.appendChild(filesList);
    usersList.appendChild(userItem);
  }
}

// Cargar datos al iniciar.
loadUsersAndFiles().catch((error) => {
  console.error("Error inicial al cargar datos", error);
  showMessage(adminMessage, "No se pudieron cargar los usuarios.", "error");
});
