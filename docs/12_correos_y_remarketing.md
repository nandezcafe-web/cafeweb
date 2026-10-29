# Correos y remarketing, sin pagar

**Fecha:** 22 de octubre de 2026
**Para qué:** guardar cada correo que deja la gente en la página, darle la bienvenida con un bono, llevar pedidos, despachos y suscripciones, y escribir campañas, con costo cero.

---

## 1. Por qué no MailerLite (todavía)

| Opción | Costo | Límite |
|---|---|---|
| MailerLite gratis | $0 | 250 contactos y 2.500 correos al mes desde junio de 2026 |
| MailerLite Comfort | Desde USD 12 al mes | Según el tamaño de la lista |
| **Hoja de Google + Gmail (lo que quedó armado)** | **$0** | Gmail gratis envía a unas 100 personas al día; Google Workspace, 1.500 |

Fuentes: [Mailsoftly](https://mailsoftly.com/blog/mailerlite-free-plan-changes/), [Email Software Insights](https://www.emailsoftwareinsights.com/reviews/mailerlite/pricing/free-plan/), [Email Tool Tester](https://www.emailtooltester.com/en/reviews/mailerlite/pricing/). Revisar la página de precios de MailerLite antes de decidir: los límites cambiaron este año.

Cuando la lista pase de unos cientos de personas activas, o se quieran automatizaciones más finas, la pestaña Correos exporta un CSV que MailerLite (o Brevo) importa tal cual.

## 2. Cómo funciona

1. **La página** manda cada registro a un script de Google: comunidad, listas de espera, suscripción, cotizaciones y pedidos.
2. **El script** ([tools/correos/Codigo.gs](../tools/correos/Codigo.gs)) lo anota en una Hoja de Google de Nandez, con tres pestañas:
   - **Contactos:** un correo por fila, con sus etiquetas (`comunidad`, `espera: Tibo B`, `suscripción: cosecha`…), si acepta correos, alta, último registro y baja.
   - **Registros:** la bitácora completa de lo que llegó.
   - **Envíos:** cada campaña enviada.
   - **Entregas:** a quién le llegó cada campaña, para no repetirla.
   - **Bonos:** el código de bienvenida de cada persona, cuándo vence y en qué pedido se usó.
   - **Pedidos:** cada pedido de la tienda con su estado, pago, guía y transportadora.
   - **Suscripciones:** plan, molienda, frecuencia, estado y fecha del próximo envío.
3. **El panel interno**, pestaña **Correos**, muestra los contactos, los filtra por etiqueta, los exporta a CSV y envía campañas desde el Gmail de Nandez.
4. **Cada correo** lleva la marca y un enlace firmado para darse de baja. Quien se da de baja no vuelve a recibir campañas, salvo que se una otra vez con la casilla.

### Lo que pasa solo

| Cuándo | Qué |
|---|---|
| Alguien se une a la comunidad con la casilla | Queda en la hoja al instante (ya no se abre el correo) y le llega la bienvenida con su bono |
| Alguien entra por **/la-gang** con la casilla | Lo mismo que la comunidad: bienvenida y bono (una sola vez por correo) |
| Alguien se suscribe | Queda en **Suscripciones** «en espera» y le llega la constancia: plan, frecuencia, molienda y que hoy no se cobra |
| En el panel, *Activar* una suscripción | Al suscriptor le llega la fecha de su primera caja |
| 3 días antes de cada caja | Al suscriptor: «tu caja sale el…», con la molienda; si paga mes a mes, el recordatorio del pago; si es la 6.ª de 6, que se acaba y cómo renovar |
| Alguien hace un pedido | Queda en **Pedidos**; a Nandez le llega el aviso y al cliente la constancia |
| En el panel, *Despachar* con la guía | Al cliente le llega la guía por correo |
| En el panel, *Registrar envío* de una suscripción | Al suscriptor le llega la guía y la próxima fecha se corre 1 o 2 meses |
| Cada mañana a las 7 | A `nandezcafe@gmail.com`: qué hay por despachar, qué suscripciones tocan en 3 días (o están atrasadas) y qué pedidos falta confirmar. Si no hay nada, no escribe |
| Día 23 del bono sin usar | Recordatorio: «te quedan 7 días» (una sola vez) |

### La estrategia del bono

- **10 % en la primera compra**, código personal `GANG-XXXXX`, un solo uso, vence a los **30 días**. Se cambia en `BONO` (Codigo.gs) y `BONO_PCT` (shop.js y operacion.js).
- **Dónde se ofrece:** el formulario del pie, la página `/la-gang` y un pop-up. Los tres piden lo mismo —un correo y la casilla— y los tres terminan en la hoja: el código lo crea `bienvenida_`, nunca el navegador.
- **El pop-up** sale abajo a un lado, no tapa la página y no se puede volver a ver si se cierra (45 días). Espera a que la visita muestre interés: 12 segundos como mínimo, y media página leída o medio minuto. No aparece si ya se apuntó, si ya tiene un bono puesto, si está en `/la-gang` —esa página es el mismo registro— o si no hay hoja conectada, porque entonces no habría bono que prometer. Tampoco va en el HTML armado: lo pinta el navegador, así que los buscadores no lo ven y no cuenta como anuncio que tapa la página. Se ajusta en `POP_*` (main.js).
- **Por qué 10 % y no envío gratis:** el envío gratis ya existe desde $150.000; en una bolsa de $38.000 el 10 % son $3.800, menos que los $12.000 del envío, y empuja a llevar dos.
- **Por qué con fecha:** sin vencimiento el bono se olvida; 30 días dejan pensar, el recordatorio del día 23 rescata a los indecisos.
- **Por qué personal y por correo:** el código solo llega al buzón que se registró, así que también comprueba que el correo es real.
- El botón del correo lleva a la tienda con el bono ya puesto en el carrito (`/cafes?bono=GANG-XXXXX`).
- Qué medir: en el panel, pestaña **Pedidos**, «bonos usados de entregados». Por encima del 15 % va bien.

### La ley (1581 de 2012)

- Solo reciben publicidad quienes marcaron la casilla "Acepto recibir noticias y ofertas" en la comunidad.
- Las listas de espera y la suscripción guardan el correo para avisar de **ese** producto, no para publicidad.
- La política de datos de la página explica todo esto, y cada correo trae su enlace de baja.

## 3. Puesta en marcha (unos 10 minutos, una sola vez)

1. Entrar a [script.google.com](https://script.google.com) con la cuenta de Google de Nandez (`nandezcafe@gmail.com`) y crear un **proyecto nuevo**. Llamarlo "Nandez · correos".
2. Borrar lo que trae y **pegar todo** el archivo [tools/correos/Codigo.gs](../tools/correos/Codigo.gs). Guardar.
3. Arriba, escoger la función **configurar** y darle **Ejecutar**. Google pide permisos (Hojas de cálculo, Gmail): aceptarlos. Si aparece "Google no verificó esta app", entrar en *Configuración avanzada* → *Ir a Nandez · correos*: es el script propio.
4. En el **registro de ejecución** aparecen dos cosas: la dirección de la hoja y la **clave del panel**. Guardar la clave.
5. **Implementar → Nueva implementación → Aplicación web.**
   - Ejecutar como: **yo**.
   - Quién tiene acceso: **cualquier persona**.
   - Copiar la **URL de la aplicación web** (termina en `/exec`).
6. Esa URL va en `CONFIG.registro`, en [prototipo/js/core.js](../prototipo/js/core.js). Después: `node tools/build.js`, commit y push.
7. Abrir el panel interno → **Correos** → pegar la clave. Queda guardada en ese navegador. La pestaña **Pedidos** usa la misma.
8. En el editor del script, *Configuración del proyecto* → **Zona horaria: (GMT-05:00) Bogotá**, para que el aviso de las 7 y las fechas sean de Colombia.

Si el script ya estaba publicado con la versión anterior: pegar el archivo nuevo, ejecutar **configurar** otra vez (crea las hojas nuevas y el aviso diario, no toca lo que hay) y publicar una **nueva versión** de la misma implementación.

Si más adelante se cambia el script, hay que publicar una **nueva versión** de la misma implementación (Implementar → Administrar implementaciones → editar), para que la URL no cambie.

## 4. Probar el script sin Google

```bash
node tools/correos/prueba.js tools/correos/Codigo.gs
```

Imita la hoja, Gmail y las propiedades en memoria y revisa 65 casos: etiquetas, autorización, clave, baja firmada, cuota diaria, bienvenida y bono, pedidos, despachos, suscripciones con sus tres correos, la gang y el aviso diario.

## 5. Cuidados

- **La URL del script es pública** (los formularios la usan), así que cualquiera podría mandarle registros falsos. No puede leer ni enviar nada sin la clave.
- **La clave** solo vive en las propiedades del script y en el navegador de quien la pegó. Si se filtra: en el editor, *Configuración del proyecto → Propiedades del script*, cambiar `CLAVE` y pegarla de nuevo en el panel.
- **La cuota de Gmail** se reinicia cada 24 horas. Si una campaña no alcanza, el panel lo dice. Al otro día se envía la misma campaña, con el mismo asunto, y solo les llega a quienes faltan: cada entrega queda anotada en la pestaña **Entregas** de la hoja.
