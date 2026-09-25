import type * as React from 'react';
type Icon = React.ComponentType<{ size?: number; weight?: 'regular'|'duotone'|'fill'|'bold'|'light'|'thin'; color?: string }>;
type ReactNode = React.ReactNode;

/** El logotipo oficial como imagen, con versión blanca automática en tema oscuro. */
export declare function Logo(props: { src: string; darkSrc?: string; alt?: string; width?: number; [k: string]: any }): React.ReactElement;
/** Antetítulo en mayúsculas espaciadas; con regla naranja opcional. */
export declare function Overline(props: { children: ReactNode; rule?: boolean; as?: string; [k: string]: any }): React.ReactElement;
/** Imagen con la esquina firma de CRECE (radio 100 abajo a la derecha) y marco naranja opcional. */
export declare function SignatureImage(props: { src: string; alt?: string; frame?: boolean; height?: number; [k: string]: any }): React.ReactElement;
/** Botón de acción con 7 variantes, 3 tamaños, íconos, carga y bloque. */
export declare function Button(props: { variant?: 'primary'|'secondary'|'tertiary'|'ghost'|'accent'|'danger'|'link'; size?: 'sm'|'md'|'lg'; icon?: Icon; trailingIcon?: Icon; arrow?: boolean; loading?: boolean; block?: boolean; as?: 'button'|'a'; disabled?: boolean; onClick?: () => void; [k: string]: any }): React.ReactElement;
/** Botón cuadrado de 44px solo con ícono, en 5 estilos. */
export declare function IconButton(props: { icon: Icon; label: string; variant?: 'plain'|'outline'|'tonal'|'filled'|'danger'; size?: 'sm'|'md'; round?: boolean; badge?: boolean; [k: string]: any }): React.ReactElement;
/** Agrupa botones relacionados, separados o unidos. */
export declare function ButtonGroup(props: { children: ReactNode; attached?: boolean; [k: string]: any }): React.ReactElement;
/** Botón flotante para la acción principal de una pantalla móvil. */
export declare function Fab(props: { icon?: Icon; label: string; extended?: boolean; variant?: 'accent'|'brand'; [k: string]: any }): React.ReactElement;
/** Enlace de texto en `brand`, con flecha diagonal para enlaces externos. */
export declare function Link(props: { children: ReactNode; href?: string; external?: boolean; onClick?: () => void; [k: string]: any }): React.ReactElement;
/** Selector de 2–4 opciones excluyentes en una píldora. */
export declare function SegmentedControl(props: { options: (string | [value, label, Icon?])[]; value: string; onChange: (v) => void; block?: boolean; soft?: boolean; [k: string]: any }): React.ReactElement;
/** Píldora compacta para filtros, selección múltiple o entradas removibles. */
export declare function Chip(props: { children: ReactNode; selected?: boolean; onClick?: () => void; onRemove?: () => void; icon?: Icon; [k: string]: any }): React.ReactElement;
/** Campo de texto con etiqueta arriba, ayuda, error, ícono, prefijo/sufijo, contador, contraseña y multilínea. */
export declare function TextField(props: { label?: string; help?: string; error?: string; optional?: boolean; icon?: Icon; prefix?: string; suffix?: string; multiline?: boolean; rows?: number; maxLength?: number; type?: string; value?; defaultValue?; onChange?; disabled?: boolean; [k: string]: any }): React.ReactElement;
/** Lista desplegable nativa con el estilo de campo. */
export declare function Select(props: { label?: string; options: (string | [value, label])[]; value?; defaultValue?; onChange?: (v) => void; placeholder?: string; help?; error?; disabled?; [k: string]: any }): React.ReactElement;
/** Campo de monto en quetzales con cifra grande y separadores de miles. */
export declare function CurrencyField(props: { label?: string; value: number | ""; onChange: (n) => void; currency?: string; help?; error?; min?; max?; [k: string]: any }): React.ReactElement;
/** Buscador en píldora con lupa. */
export declare function SearchField(props: { placeholder?: string; value?: string; onChange?: (v) => void; label?: string; [k: string]: any }): React.ReactElement;
/** Casilla de verificación con descripción opcional; animación de marca al marcar. */
export declare function Checkbox(props: { label: ReactNode; description?: ReactNode; checked?; defaultChecked?; onChange?; disabled?; [k: string]: any }): React.ReactElement;
/** Botón de radio individual (usa RadioGroup en la mayoría de casos). */
export declare function Radio(props: { label: ReactNode; description?: ReactNode; name?; checked?; onChange?; [k: string]: any }): React.ReactElement;
/** Grupo de opciones excluyentes con descripción opcional. */
export declare function RadioGroup(props: { options: (string | [value, label, description?])[]; value; onChange: (v) => void; row?: boolean; name?: string; label?: string; [k: string]: any }): React.ReactElement;
/** Interruptor de efecto inmediato con etiqueta y descripción. */
export declare function Switch(props: { label: ReactNode; description?: ReactNode; checked?; defaultChecked?; onChange?: (checked) => void; [k: string]: any }): React.ReactElement;
/** Control deslizante con valor vivo y límites. */
export declare function Slider(props: { label: ReactNode; min; max; step?; value: number; onChange: (n) => void; format?: (n) => string; showLimits?: boolean; [k: string]: any }): React.ReactElement;
/** Contador con botones − / + para valores enteros pequeños. */
export declare function NumberStepper(props: { value: number; onChange: (n) => void; min?; max?; step?; format?; label?; [k: string]: any }): React.ReactElement;
/** Entrada de código OTP/PIN por dígitos con avance automático. */
export declare function PinInput(props: { length?: number; masked?: boolean; invalid?: boolean; onComplete?: (code) => void; label?: string; [k: string]: any }): React.ReactElement;
/** Opciones excluyentes como tarjetas tocables, con ícono y descripción. */
export declare function ChoiceCards(props: { options: { value, title, description?, icon? }[]; value; onChange: (v) => void; columns?: number; label?: string; [k: string]: any }): React.ReactElement;
/** Zona para arrastrar o seleccionar archivos. */
export declare function FileDrop(props: { title?: string; hint?: string; accept?: string; onFiles?: (files: File[]) => void; [k: string]: any }): React.ReactElement;
/** Contenedor de contenido con 6 variantes y opción interactiva. */
export declare function Card(props: { title?: ReactNode; action?: ReactNode; variant?: 'default'|'flat'|'tinted'|'elevated'|'brand'; interactive?: boolean; signature?: boolean; media?: string; children; [k: string]: any }): React.ReactElement;
/** Lista de ítems con divisores, normal o en tarjeta (`inset`). */
export declare function List(props: { children: ListItem[]; inset?: boolean; [k: string]: any }): React.ReactElement;
/** Fila con elemento inicial, título, descripción, contenido final y chevron. */
export declare function ListItem(props: { title: ReactNode; description?: ReactNode; icon?: Icon; leading?: ReactNode; trailing?: ReactNode; chevron?: boolean; onClick?; href?; [k: string]: any }): React.ReactElement;
/** Iniciales o foto en círculo (o cuadrado), con estado y grupos. */
export declare function Avatar(props: { name: string; src?: string; size?: 'sm'|'md'|'lg'; square?: boolean; online?: boolean; [k: string]: any }): React.ReactElement;
/** Avatares superpuestos con contador de excedentes. */
export declare function AvatarGroup(props: { names: string[]; max?: number; size?: 'sm'|'md'|'lg'; [k: string]: any }): React.ReactElement;
/** Etiqueta de estado; el tono se deduce de estados conocidos. */
export declare function Badge(props: { children: string; tone?: 'info'|'success'|'warning'|'danger'|'neutral'; variant?: 'solid'|'accent'; pill?: boolean; dot?: boolean; [k: string]: any }): React.ReactElement;
/** Contador numérico naranja para pendientes. */
export declare function Count(props: { children: ReactNode; [k: string]: any }): React.ReactElement;
/** Separador horizontal, opcionalmente con texto. */
export declare function Divider(props: { label?: string; [k: string]: any }): React.ReactElement;
/** Cifra monetaria con moneda, decimales reducidos, signo y ocultamiento. */
export declare function Amount(props: { value: number; currency?: string; size?: number|string; sign?: boolean; hidden?: boolean; tone?: 'positive'; decimals?: number; [k: string]: any }): React.ReactElement;
/** Indicador con etiqueta, cifra, variación y ayuda. */
export declare function Stat(props: { label: ReactNode; value: ReactNode; icon?: Icon; delta?: number; deltaLabel?: string; help?: string; [k: string]: any }): React.ReactElement;
/** Pares clave/valor con divisores. */
export declare function DescriptionList(props: { items: [ReactNode, ReactNode][]; [k: string]: any }): React.ReactElement;
/** Tabla de datos con columnas configurables, numéricas alineadas y fila clicable. */
export declare function DataTable(props: { columns: { key, label, numeric?, width?, render?: (row) => ReactNode }[]; rows: object[]; caption?: string; onRowClick?: (row) => void; empty?: ReactNode; [k: string]: any }): React.ReactElement;
/** Secciones plegables (details nativo), exclusivas por defecto. */
export declare function Accordion(props: { items: { title, content, open? }[]; exclusive?: boolean; [k: string]: any }): React.ReactElement;
/** Pestañas subrayadas con contador opcional; el indicador crece al activar. */
export declare function Tabs(props: { tabs: (string | [value, label, count?])[]; value; onChange: (v) => void; fill?: boolean; [k: string]: any }): React.ReactElement;
/** Secuencia vertical de eventos con estados done/current/pending/error. */
export declare function Timeline(props: { items: { title, description?, meta?, state?: 'done'|'current'|'pending'|'error', icon? }[]; [k: string]: any }): React.ReactElement;
/** Estado vacío con ilustración de marca (esquina firma), título esperanzador y acción. */
export declare function EmptyState(props: { icon?: Icon; title: ReactNode; description?: ReactNode; action?: ReactNode; [k: string]: any }): React.ReactElement;
/** Placeholder animado que imita la forma del contenido mientras carga. */
export declare function Skeleton(props: { width?; height?; circle?: boolean; lines?: number; [k: string]: any }): React.ReactElement;
/** Barra de progreso con etiqueta y valor; entra creciendo. */
export declare function ProgressBar(props: { value: number; max?: number; label?: string; valueLabel?: string; tone?: 'accent'|'success'; indeterminate?: boolean; [k: string]: any }): React.ReactElement;
/** Anillo de progreso animado con valor al centro. */
export declare function ProgressRing(props: { value: number; size?: number; stroke?: number; tone?: 'accent'|'brand'; label?: string; [k: string]: any }): React.ReactElement;
/** Burbuja de ayuda breve al pasar el cursor o enfocar. */
export declare function Tooltip(props: { content: ReactNode; children: ReactNode; open?: boolean; [k: string]: any }): React.ReactElement;
/** Mensaje en línea informativo, de éxito, atención o error, con título y acciones. */
export declare function Alert(props: { tone?: 'info'|'success'|'warning'|'danger'; title?: ReactNode; children; actions?: ReactNode; onClose?: () => void; outline?: boolean; banner?: boolean; [k: string]: any }): React.ReactElement;
/** Confirmación breve y temporal (snackbar) con acción opcional. */
export declare function Toast(props: { children; tone?: 'success'; action?: string; onAction?: () => void; onClose?: () => void; [k: string]: any }): React.ReactElement;
/** Indicador circular de carga para acciones puntuales. */
export declare function Spinner(props: { size?: number; label?: string; [k: string]: any }): React.ReactElement;
/** Diálogo modal con título, ícono, cuerpo con scroll y pie de acciones. */
export declare function Dialog(props: { open?: boolean; title: ReactNode; children; footer?: ReactNode; onClose?: () => void; size?: 'sm'|'md'|'lg'; icon?: Icon; tone?: 'danger'; inline?: boolean; [k: string]: any }): React.ReactElement;
/** Hoja inferior móvil con asa, título y contenido. */
export declare function BottomSheet(props: { title?: ReactNode; children; onClose?: () => void; [k: string]: any }): React.ReactElement;
/** Barra superior de la web app: título/migas, búsqueda y acciones. */
export declare function TopBar(props: { title?: ReactNode; leading?: ReactNode; actions?: ReactNode; children?; [k: string]: any }): React.ReactElement;
/** Navegación lateral de la web app con secciones, contadores y pie. */
export declare function Sidebar(props: { brand?: ReactNode; items: ({ id, label, icon, count? } | { section })[]; active; onNavigate?; footer?: ReactNode; [k: string]: any }): React.ReactElement;
/** Barra superior móvil con regresar, título y acciones. */
export declare function AppBar(props: { title: ReactNode; onBack?: () => void; actions?: ReactNode; variant?: 'brand'; center?: boolean; [k: string]: any }): React.ReactElement;
/** Barra de navegación inferior móvil con 3–5 destinos. */
export declare function BottomNav(props: { items: { id, label, icon, count? }[]; active: string; onChange: (id) => void; [k: string]: any }): React.ReactElement;
/** Ruta jerárquica de la página actual. */
export declare function Breadcrumbs(props: { items: { label, href? }[]; [k: string]: any }): React.ReactElement;
/** Paginación numérica con anterior/siguiente. */
export declare function Pagination(props: { page: number; pages: number; onChange: (p) => void; [k: string]: any }): React.ReactElement;
/** Indicador de pasos de un flujo en barras. */
export declare function Steps(props: { steps: string[]; current: number; [k: string]: any }): React.ReactElement;
/** Menú de acciones contextuales (dropdown). */
export declare function Menu(props: { items: ({ label, icon?, danger?, onClick? } | '-')[]; [k: string]: any }): React.ReactElement;
/** Marco de web app: Sidebar + TopBar + contenido con ancho máximo. */
export declare function AppShell(props: { sidebar?: ReactNode; topbar?: ReactNode; children; [k: string]: any }): React.ReactElement;
/** Encabezado de página: migas, overline, título, descripción y acciones. */
export declare function PageHeader(props: { overline?; title; description?; actions?: ReactNode; breadcrumbs?: ReactNode; [k: string]: any }): React.ReactElement;
/** Marco de teléfono (390×844) para documentar y prototipar pantallas móviles. */
export declare function DeviceFrame(props: { children; statusTone?: 'brand'; time?: string; [k: string]: any }): React.ReactElement;
/** Área de contenido con scroll dentro de DeviceFrame. */
export declare function DeviceBody(props: { children; padded?: boolean; [k: string]: any }): React.ReactElement;
/** Hace entrar a sus hijos en cascada (crecer hacia arriba, 60ms entre cada uno). */
export declare function Stagger(props: { children; as?: string; className?: string; [k: string]: any }): React.ReactElement;
/** Cifra que cuenta hasta su nuevo valor (ease-out cúbico, 600ms). */
export declare function AnimatedNumber(props: { value: number; duration?: number; format?: (n) => string; [k: string]: any }): React.ReactElement;
/** Tarjeta de cuenta con saldo, número enmascarado y botón para ocultar. */
export declare function AccountCard(props: { label?: string; number?: string; balance: number; available?: number; light?: boolean; hidden?: boolean; onToggle?: (hidden) => void; [k: string]: any }): React.ReactElement;
/** Grilla de accesos rápidos con ícono duotono. */
export declare function QuickActions(props: { items: { label, icon, accent?, onClick? }[]; columns?: number; [k: string]: any }): React.ReactElement;
/** Movimiento con ícono, descripción, fecha y monto con signo. */
export declare function TransactionItem(props: { title: string; meta: string; amount: number; icon?: Icon; incoming?: boolean; [k: string]: any }): React.ReactElement;
/** Meta de ahorro con progreso naranja, fecha y montos. */
export declare function SavingsGoal(props: { name: string; target: number; saved: number; date?: string; icon?: Icon; [k: string]: any }): React.ReactElement;
/** Simulador de cuota: monto, plazo y cuota animada con desglose y CTA. */
export declare function LoanCalculator(props: { min?; max?; step?; rate?; terms?: number[]; defaultAmount?; defaultTerm?; onApply?: ({ amount, term, payment }) => void; ctaLabel?: string; [k: string]: any }): React.ReactElement;
/** Plan de pagos (mes, cuota, capital, interés, saldo). */
export declare function AmortizationTable(props: { schedule: { month, payment, capital, interest, balance }[]; limit?: number; [k: string]: any }): React.ReactElement;
/** Seguimiento de una solicitud por etapas (sobre Timeline). */
export declare function StatusTracker(props: { steps?: string[]; current: number; meta?: Record<number, string>; error?: string; [k: string]: any }): React.ReactElement;
/** Lista de documentos requeridos con estado y acción de subir. */
export declare function DocumentChecklist(props: { items: { key?, title, file? }[]; onUpload?: (item) => void; [k: string]: any }): React.ReactElement;
/** Mini tendencia sin ejes, con área y punto final. */
export declare function Sparkline(props: { data: number[]; width?; height?; tone?: string; area?: boolean; [k: string]: any }): React.ReactElement;
/** Barras simples, agrupadas o apiladas con tooltip y paleta validada. */
export declare function BarChart(props: { data: { label, [key]: number }[]; series?: string[]; stacked?: boolean; height?: number; format?: (n) => string; label?: string; [k: string]: any }): React.ReactElement;
/** Proporciones de un total con leyenda y porcentajes. */
export declare function DonutChart(props: { data: { label, value }[]; size?; thickness?; format?; centerLabel?; centerValue?; [k: string]: any }): React.ReactElement;

export declare const Icons: Record<string, Icon>;
export declare function money(value: number, digits?: number, currency?: string): string;
export declare function number(value: number, digits?: number): string;
export declare function dateTime(value: string | number | Date, opts?: Intl.DateTimeFormatOptions): string;
export declare function calculateLoan(principal: number, months: number, annualRate: number): { payment: number; total: number; interest: number; schedule: { month: number; payment: number; capital: number; interest: number; balance: number }[] };
export declare const STATUS_TONE: Record<string, 'neutral'|'info'|'success'|'warning'|'danger'>;
export declare function useTheme(): ['light' | 'dark', () => void];
