# La pauta del Drop 001

**Fecha:** 19 de noviembre de 2026, un día antes del lanzamiento
**Para qué:** qué está pasando hoy con los anuncios, qué hay que hacer mañana y en qué orden.
**Lo del píxel va aparte:** [docs/16_pixel_meta.md](16_pixel_meta.md).

---

## 1. Lo único que importa hoy

> **Los anuncios llevan seis días sin entregar.** La cuenta publicitaria llegó a su límite de gasto y Meta apagó todo. Lo dice ella misma, en los dos conjuntos que están activos:
>
> ```
> delivery: { status: "off", substatuses: ["account_spend_limit_reached"] }
> ```
>
> Del 16 al 19 de noviembre: **0 impresiones, $0 gastados**. El drop es mañana.

Se arregla en un sitio: **Administrador de anuncios → Configuración de la cuenta publicitaria → Límite de gasto de la cuenta.** Subirlo o quitarlo. Mientras no se haga, nada de lo que diga este documento va a correr.

La cuenta es `act_1660561935534454` (NandezCoffeeGang), está `ACTIVE` y tiene medio de pago.

## 2. Qué pasó, para no repetirlo

Entre el 5 y el 14 de noviembre la cuenta gastó **$254.456 COP** y ahí topó. Así se repartió:

| Campaña | Gasto | % | Qué compró | Costo unitario |
|---|---|---|---|---|
| Expectativa perfil IG | $150.851 | **59 %** | 794 visitas al perfil | $190 |
| Preventa web | $51.579 | 20 % | 663 clics → 267 visitas a la tienda | $193 por visita |
| Ventas (pausada) | $40.218 | 16 % | 4 agregados al carrito | ~$10.000 |
| Reconocimiento (pausada) | $11.808 | 5 % | 17.952 personas alcanzadas | $660 por mil |

Seis de cada diez pesos fueron a Instagram y dos a la tienda. Para la etapa de expectativa tenía lógica; a partir de mañana ya no.

**La fuga:** de 663 clics pagados, solo 267 cargaron la página — el 40 %. Se pagaba el toque, no la llegada. Ya está corregido (punto 3).

**Lo que no se midió bien:** la campaña de Instagram tenía dos anuncios con cero «clics en el enlace», lo que parecía plata tirada. No lo era: esa campaña compra *visitas al perfil*, y las tuvo. Al revisar una campaña hay que pedir su métrica propia (`results` y `cost_per_result`), no la que uno supone.

## 3. Lo que ya quedó cambiado

El 17 de noviembre, en el conjunto de la campaña de Preventa:

- **Optimiza por visitas a la página** (`LANDING_PAGE_VIEWS`), antes por clics (`LINK_CLICKS`). Meta ahora cobra por quien llega a cargar la tienda, no por quien toca el anuncio. Reinició el aprendizaje, a propósito, para que lo hiciera antes del drop y no durante.
- **Se llama `Web_5ciudades_20-35_VisitasTienda`**, antes `…_ClicsALaTienda`, que ya no era cierto.

Meta terminó de procesarlo: `effective_status: ACTIVE`.

## 4. Mañana, en orden

1. **Subir el límite de gasto.** Sin esto no hay punto 2.
2. **Despausar `META_Ventas_Web_Drop001_Compras_Nov26`** (presupuesto $30.000 diarios), y dejarla optimizando a **AddToCart**, como está.
3. **Decidir el presupuesto de Instagram.** La campaña de expectativa **termina sola mañana a las 5:00 p. m.** Si no se hace nada, ese 59 % del gasto simplemente deja de existir; si la tienda lo necesita, hay que moverlo a mano.
4. **Concentrar en el Cenicafé 1.** De los tres anuncios de la tienda, `Web_Cenicafe1_Frescura_Nov26` trajo 411 de los 663 clics a $73 cada uno. `Web_Castillo_Origen` cuesta $82 y `Web_LosTres_EnvioGratis` $89.

## 5. Lo que NO hay que hacer

- **No pasar la campaña de Ventas a optimizar por `Purchase`.** Nunca ha habido una compra y solo hay 17 AddToCart en total: Meta no tendría de dónde aprender y entregaría peor. Se cambia cuando haya compras acumuladas, no antes.
- **No montar un conjunto de remarketing todavía.** El píxel tiene 286 PageView, 34 ViewContent, 17 AddToCart y 4 InitiateCheckout. Son unos cientos de personas: alcanza para *crear* los públicos y que empiecen a llenarse, no para sostener un conjunto. Eso llega con el tráfico del drop.
- **No pegar el código base del píxel en el `<head>`.** Ya está puesto, dentro de `medir.js`. Pegarlo otra vez cargaría el píxel sin permiso (Ley 1581) y contaría el `PageView` doble. El porqué completo está en [docs/16_pixel_meta.md](16_pixel_meta.md).

## 6. Qué mirar después del drop

| Cifra | Dónde | Qué dice |
|---|---|---|
| Clics → visitas a la página | Administrador de anuncios | Antes 40 %. Es la que debe subir con el cambio del punto 3. El total de clics va a bajar, y está bien. |
| `Purchase` en el conjunto de datos | Administrador de eventos | La primera compra real. Hasta hoy no hay ninguna. |
| Costo por AddToCart | Administrador de anuncios | $10.000 en dos días de aprendizaje; ese número todavía no significa nada. |
| Visitas de la página | Panel interno, pestaña Actividad | Cuenta a todo el mundo, no solo a quien aceptó cookies. Siempre va a ser mayor que el embudo de al lado. |

## 7. La cuenta, para tenerla a mano

- Cuenta publicitaria: `act_1660561935534454` (NandezCoffeeGang), portafolio **Bushido Agencia**
- Conjunto de datos: `1805850087187226` (Nandez Coffee Gang)
- Página de Facebook: `1374866889035262` · Instagram: `@nandezcoffee`
- Dominio de conversión en los anuncios web: `nandezcoffee.com`

Las campañas: `META_Trafico_PerfilIG_Expectativa_Drop001_Nov26` (activa, termina el 20 a las 5 p. m.), `META_Ventas_Web_Drop001_Preventa_Nov26` (activa), `META_Ventas_Web_Drop001_Compras_Nov26` (pausada), `Nueva campaña de Reconocimiento` (pausada).
