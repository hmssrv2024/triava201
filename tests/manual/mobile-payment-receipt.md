# Mobile payment receipt amount confirmation

## Objetivo
Verificar que la alerta de carga del comprobante muestre el monto en bolívares correcto y que no sea posible continuar sin un monto seleccionado.

## Escenario 1: Monto elegido manualmente
1. Inicia sesión con un usuario habilitado y navega hasta la sección de recargas móviles estándar.
2. Selecciona un banco y escoge un monto desde la lista desplegable de montos.
3. Haz clic en "Adjuntar comprobante" y elige un archivo válido (menor a 5 MB).
4. Comprueba que la alerta de confirmación muestre el mismo monto en Bs que aparece en el selector.
5. Cancela la alerta, vuelve a adjuntar el comprobante y confirma para asegurarte de que la previsualización se active correctamente.

## Escenario 2: Flujo bloqueado con monto prefijado
1. Activa el flujo de recarga bloqueada (por ejemplo, iniciando la verificación que muestra el monto requerido en el recuadro "Monto de la verificación").
2. Sin seleccionar montos adicionales, intenta subir un comprobante desde la sección bloqueada.
3. Verifica que la alerta de confirmación utilice el monto en Bs mostrado en el recuadro bloqueado.
4. Limpia el monto almacenado (por ejemplo, refrescando y sin iniciar la verificación) y vuelve a intentar subir un comprobante. Confirma que aparece un toast de error indicando que debes seleccionar un monto y que no se abre la alerta.
