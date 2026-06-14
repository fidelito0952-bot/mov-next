import { Setting } from "./settings";

export type BancoOption = {
  value: string;
  label: string;
  enabled: boolean;
};

export const BANCOS_PSE = [
  { value: "BANCOLOMBIA", label: "Bancolombia" },
  { value: "BOGOTA", label: "Banco de Bogotá" },
  { value: "AVVILLAS", label: "Banco AV Villas" },
  { value: "BBVA", label: "BBVA" },
  { value: "DAVIVIENDA", label: "Davivienda" },
  { value: "FALABELLA", label: "Banco Falabella" },
  { value: "DAVIBANK", label: "Davibank" },
  { value: "POPULAR", label: "Banco Popular" },
  { value: "CITIBANK", label: "Citibank" },
  { value: "CAJASOCIAL", label: "Banco Caja Social" },
  { value: "ITAU", label: "Banco Itaú" },
  { value: "OCCIDENTE", label: "Banco de Occidente" },
  { value: "NEQUI", label: "Nequi" },
  { value: "TUYA", label: "Tuya" },
  { value: "SERFINANZA", label: "Serfinanza" },
] as const;

export const MAPA_BANCOS_API: Record<string, { id: string; nombre: string }> = {
  alianza_fiduciaria: { id: "1815", nombre: "ALIANZA FIDUCIARIA" },
  ban100: { id: "1558", nombre: "BAN100" },
  bancamia: { id: "1059", nombre: "BANCAMIA S.A." },
  banco_agrario: { id: "1040", nombre: "BANCO AGRARIO" },
  banco_av_villas: { id: "1052", nombre: "BANCO AV VILLAS" },
  banco_bbva_colombia: { id: "1013", nombre: "BANCO BBVA COLOMBIA S.A." },
  banco_caja_social: { id: "1032", nombre: "BANCO CAJA SOCIAL" },
  banco_cooperativo_coopcentral: {
    id: "1066",
    nombre: "BANCO COOPERATIVO COOPCENTRAL",
  },
  banco_de_bogota: { id: "1001", nombre: "BANCO DE BOGOTA" },
  banco_de_occidente: { id: "1023", nombre: "BANCO DE OCCIDENTE" },
  banco_falabella: { id: "1062", nombre: "BANCO FALABELLA" },
  banco_finandina: { id: "1063", nombre: "BANCO FINANDINA S.A. BIC" },
  banco_gnb_sudameris: { id: "1012", nombre: "BANCO GNB SUDAMERIS" },
  banco_itau: { id: "1006", nombre: "BANCO ITAU" },
  banco_jp_morgan: { id: "1071", nombre: "BANCO J.P. MORGAN COLOMBIA S.A." },
  banco_mundo_mujer: { id: "1047", nombre: "BANCO MUNDO MUJER S.A." },
  banco_pichincha: { id: "1060", nombre: "BANCO PICHINCHA S.A." },
  banco_popular: { id: "1002", nombre: "BANCO POPULAR" },
  banco_santander: { id: "1065", nombre: "BANCO SANTANDER COLOMBIA" },
  banco_serfinanza: { id: "1069", nombre: "BANCO SERFINANZA" },
  banco_union: { id: "1303", nombre: "BANCO UNION antes GIROS" },
  bancolombia: { id: "1007", nombre: "BANCOLOMBIA" },
  bancoomeva: { id: "1061", nombre: "BANCOOMEVA S.A." },
  bold_cf: { id: "1808", nombre: "BOLD CF" },
  cfa_cooperativa: { id: "1283", nombre: "CFA COOPERATIVA FINANCIERA" },
  citibank: { id: "1009", nombre: "CITIBANK" },
  coink: { id: "1812", nombre: "COINK SA" },
  coltefinanciera: { id: "1370", nombre: "COLTEFINANCIERA" },
  confiar: { id: "1292", nombre: "CONFIAR COOPERATIVA FINANCIERA" },
  cotrafa: { id: "1289", nombre: "COTRAFA" },
  crezcamos: { id: "1816", nombre: "Crezcamos-MOSí" },
  dale: { id: "1097", nombre: "DALE" },
  ding: { id: "1802", nombre: "DING" },
  financiera_juriscoop: { id: "1121", nombre: "FINANCIERA JURISCOOP" },
  global66: { id: "1814", nombre: "GLOBAL66" },
  iris: { id: "1637", nombre: "IRIS" },
  jfk_cooperativa: { id: "1286", nombre: "JFK COOPERATIVA FINANCIERA" },
  lulo_bank: { id: "1070", nombre: "LULO BANK" },
  movii: { id: "1801", nombre: "MOVII S.A." },
  nequi: { id: "1507", nombre: "NEQUI" },
  nu: { id: "1809", nombre: "NU" },
  powwi: { id: "1803", nombre: "POWWI" },
  rappipay: { id: "1811", nombre: "RAPPIPAY" },
  davibank: { id: "1019", nombre: "DAVIBANK" },
  uala: { id: "1804", nombre: "UALÁ" },
};

export function getBancosOptions(): BancoOption[] {
  const gateway = process.env.PAYMENT_GATEWAY || "pasarela";

  if (gateway === "api") {
    const bancos: BancoOption[] = [
      { value: "", label: "Seleccione su banco", enabled: false },
    ];
    for (const [key, banco] of Object.entries(MAPA_BANCOS_API)) {
      bancos.push({ value: key, label: banco.nombre, enabled: true });
    }
    return bancos;
  }

  const bancos: BancoOption[] = [
    { value: "", label: "Seleccione su banco", enabled: false },
  ];
  for (const b of BANCOS_PSE) {
    const key = `banco_${b.value.toLowerCase()}_enabled`;
    if (Setting.getBool(key, true)) {
      bancos.push({ value: b.value, label: b.label, enabled: true });
    }
  }
  return bancos;
}

export function getBancosPermitidos(): string[] {
  const gateway = process.env.PAYMENT_GATEWAY || "pasarela";
  if (gateway === "api") return Object.keys(MAPA_BANCOS_API);

  return BANCOS_PSE.filter((b) =>
    Setting.getBool(`banco_${b.value.toLowerCase()}_enabled`, true)
  ).map((b) => b.value);
}

export function getBancosPseSettings() {
  return BANCOS_PSE.map((b) => {
    const key = `banco_${b.value.toLowerCase()}_enabled`;
    return {
      key,
      value: b.value,
      label: b.label,
      enabled: Setting.getBool(key, true),
    };
  });
}
