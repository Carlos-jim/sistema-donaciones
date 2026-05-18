export interface MedicamentoSeed {
  nombre: string
  descripcion: string
  principioActivo: string
  presentacion: string
  concentracion: string
  categoriaNombre: string
}

export interface CategoriaSeed {
  nombre: string
  descripcion: string
  icono: string
  orden: number
}

export const categoriasSeed: CategoriaSeed[] = [
  { nombre: "Analgésicos y Antipiréticos", descripcion: "Alivian el dolor y reducen la fiebre", icono: "Thermometer", orden: 1 },
  { nombre: "Antiinflamatorios", descripcion: "Reducen la inflamación y el dolor", icono: "Activity", orden: 2 },
  { nombre: "Antibióticos", descripcion: "Combaten infecciones bacterianas", icono: "Shield", orden: 3 },
  { nombre: "Antialérgicos", descripcion: "Controlan reacciones alérgicas", icono: "Flower2", orden: 4 },
  { nombre: "Cardiovasculares", descripcion: "Tratan enfermedades del corazón y presión arterial", icono: "Heart", orden: 5 },
  { nombre: "Metabólicos y Diabetes", descripcion: "Controlan la glucosa y metabolismo", icono: "Droplets", orden: 6 },
  { nombre: "Gastrointestinales", descripcion: "Tratan problemas digestivos", icono: "Pill", orden: 7 },
  { nombre: "Respiratorios", descripcion: "Alivian problemas respiratorios", icono: "Wind", orden: 8 },
  { nombre: "Vitaminas y Suplementos", descripcion: "Complementos nutricionales", icono: "Sun", orden: 9 },
  { nombre: "Sistema Nervioso", descripcion: "Tratan condiciones neurológicas y psiquiátricas", icono: "Brain", orden: 10 },
  { nombre: "Dermatológicos", descripcion: "Tratan afecciones de la piel", icono: "ScanFace", orden: 11 },
  { nombre: "Oftálmicos", descripcion: "Tratan afecciones oculares", icono: "Eye", orden: 12 },
]

export const medicamentosSeed: MedicamentoSeed[] = [
  // Analgésicos y Antipiréticos
  { nombre: "Paracetamol", descripcion: "Analgésico y antipirético de amplio uso", principioActivo: "Paracetamol", presentacion: "Tabletas", concentracion: "500mg", categoriaNombre: "Analgésicos y Antipiréticos" },
  { nombre: "Paracetamol Forte", descripcion: "Analgésico y antipirético de mayor concentración", principioActivo: "Paracetamol", presentacion: "Tabletas", concentracion: "750mg", categoriaNombre: "Analgésicos y Antipiréticos" },
  { nombre: "Paracetamol Pediátrico", descripcion: "Analgésico y antipirético para niños", principioActivo: "Paracetamol", presentacion: "Jarabe", concentracion: "120mg/5ml", categoriaNombre: "Analgésicos y Antipiréticos" },
  { nombre: "Tramadol", descripcion: "Analgésico opioides para dolor moderado a severo", principioActivo: "Tramadol clorhidrato", presentacion: "Cápsulas", concentracion: "50mg", categoriaNombre: "Analgésicos y Antipiréticos" },
  { nombre: "Codeína", descripcion: "Analgésico opioide para tos y dolor", principioActivo: "Fosfato de codeína", presentacion: "Tabletas", concentracion: "30mg", categoriaNombre: "Analgésicos y Antipiréticos" },
  { nombre: "Dipirona (Metamizol)", descripcion: "Analgésico y antiespasmódico potente", principioActivo: "Metamizol sódico", presentacion: "Tabletas", concentracion: "500mg", categoriaNombre: "Analgésicos y Antipiréticos" },

  // Antiinflamatorios
  { nombre: "Ibuprofeno", descripcion: "Antiinflamatorio no esteroideo (AINE)", principioActivo: "Ibuprofeno", presentacion: "Tabletas", concentracion: "400mg", categoriaNombre: "Antiinflamatorios" },
  { nombre: "Ibuprofeno 600", descripcion: "Antiinflamatorio no esteroideo de alta dosis", principioActivo: "Ibuprofeno", presentacion: "Tabletas", concentracion: "600mg", categoriaNombre: "Antiinflamatorios" },
  { nombre: "Ibuprofeno Pediátrico", descripcion: "Antiinflamatorio para niños", principioActivo: "Ibuprofeno", presentacion: "Jarabe", concentracion: "100mg/5ml", categoriaNombre: "Antiinflamatorios" },
  { nombre: "Diclofenaco", descripcion: "AINE para dolor e inflamación", principioActivo: "Diclofenaco sódico", presentacion: "Tabletas", concentracion: "50mg", categoriaNombre: "Antiinflamatorios" },
  { nombre: "Naproxeno", descripcion: "AINE de acción prolongada", principioActivo: "Naproxeno", presentacion: "Tabletas", concentracion: "250mg", categoriaNombre: "Antiinflamatorios" },
  { nombre: "Celecoxib", descripcion: "AINE selectivo COX-2", principioActivo: "Celecoxib", presentacion: "Cápsulas", concentracion: "200mg", categoriaNombre: "Antiinflamatorios" },
  { nombre: "Prednisona", descripcion: "Corticoide antiinflamatorio sistémico", principioActivo: "Prednisona", presentacion: "Tabletas", concentracion: "5mg", categoriaNombre: "Antiinflamatorios" },
  { nombre: "Prednisona 20mg", descripcion: "Corticoide de alta potencia", principioActivo: "Prednisona", presentacion: "Tabletas", concentracion: "20mg", categoriaNombre: "Antiinflamatorios" },

  // Antibióticos
  { nombre: "Amoxicilina", descripcion: "Antibiótico betalactámico de amplio espectro", principioActivo: "Amoxicilina", presentacion: "Cápsulas", concentracion: "500mg", categoriaNombre: "Antibióticos" },
  { nombre: "Amoxicilina Pediátrica", descripcion: "Antibiótico en suspensión para niños", principioActivo: "Amoxicilina", presentacion: "Jarabe", concentracion: "250mg/5ml", categoriaNombre: "Antibióticos" },
  { nombre: "Amoxicilina/Clavulánico", descripcion: "Antibiótico combinado de amplio espectro", principioActivo: "Amoxicilina/Ácido clavulánico", presentacion: "Tabletas", concentracion: "875/125mg", categoriaNombre: "Antibióticos" },
  { nombre: "Azitromicina", descripcion: "Antibiótico macrólido de amplio espectro", principioActivo: "Azitromicina", presentacion: "Cápsulas", concentracion: "500mg", categoriaNombre: "Antibióticos" },
  { nombre: "Ciprofloxacino", descripcion: "Antibiótico fluoroquinolona", principioActivo: "Ciprofloxacino", presentacion: "Tabletas", concentracion: "500mg", categoriaNombre: "Antibióticos" },
  { nombre: "Claritromicina", descripcion: "Antibiótico macrólido", principioActivo: "Claritromicina", presentacion: "Tabletas", concentracion: "500mg", categoriaNombre: "Antibióticos" },
  { nombre: "Metronidazol", descripcion: "Antibiótico antiprotozoario", principioActivo: "Metronidazol", presentacion: "Tabletas", concentracion: "500mg", categoriaNombre: "Antibióticos" },
  { nombre: "Doxiciclina", descripcion: "Antibiótico tetraciclina", principioActivo: "Doxiciclina hiclato", presentacion: "Cápsulas", concentracion: "100mg", categoriaNombre: "Antibióticos" },
  { nombre: "Trimetoprima/Sulfametoxazol", descripcion: "Antibiótico combinado (Bactrim)", principioActivo: "TMP/SMX", presentacion: "Tabletas", concentracion: "160/800mg", categoriaNombre: "Antibióticos" },
  { nombre: "Cefalexina", descripcion: "Cefalosporina de primera generación", principioActivo: "Cefalexina", presentacion: "Cápsulas", concentracion: "500mg", categoriaNombre: "Antibióticos" },

  // Antialérgicos
  { nombre: "Loratadina", descripcion: "Antihistamínico de segunda generación", principioActivo: "Loratadina", presentacion: "Tabletas", concentracion: "10mg", categoriaNombre: "Antialérgicos" },
  { nombre: "Cetirizina", descripcion: "Antihistamínico no sedante", principioActivo: "Cetirizina diclorhidrato", presentacion: "Tabletas", concentracion: "10mg", categoriaNombre: "Antialérgicos" },
  { nombre: "Fexofenadina", descripcion: "Antihistamínico de tercera generación", principioActivo: "Fexofenadina", presentacion: "Tabletas", concentracion: "180mg", categoriaNombre: "Antialérgicos" },
  { nombre: "Clorfeniramina", descripcion: "Antihistamínico de primera generación", principioActivo: "Maleato de clorfeniramina", presentacion: "Tabletas", concentracion: "4mg", categoriaNombre: "Antialérgicos" },
  { nombre: "Dexclorfeniramina", descripcion: "Antihistamínico con menor sedación", principioActivo: "Dexclorfeniramina", presentacion: "Tabletas", concentracion: "2mg", categoriaNombre: "Antialérgicos" },
  { nombre: "Montelukast", descripcion: "Antileucotrieno para asma y alergias", principioActivo: "Montelukast sódico", presentacion: "Tabletas", concentracion: "10mg", categoriaNombre: "Antialérgicos" },
  { nombre: "Hidrocortisona Tópica", descripcion: "Corticoide para reacciones alérgicas cutáneas", principioActivo: "Hidrocortisona", presentacion: "Crema", concentracion: "1%", categoriaNombre: "Antialérgicos" },

  // Cardiovasculares
  { nombre: "Losartán", descripcion: "Antagonista de receptores de angiotensina II (ARA II)", principioActivo: "Losartán potásico", presentacion: "Tabletas", concentracion: "50mg", categoriaNombre: "Cardiovasculares" },
  { nombre: "Losartán 100", descripcion: "ARA II de alta dosis para hipertensión", principioActivo: "Losartán potásico", presentacion: "Tabletas", concentracion: "100mg", categoriaNombre: "Cardiovasculares" },
  { nombre: "Valsartán", descripcion: "ARA II para hipertensión e insuficiencia cardíaca", principioActivo: "Valsartán", presentacion: "Cápsulas", concentracion: "160mg", categoriaNombre: "Cardiovasculares" },
  { nombre: "Enalapril", descripcion: "Inhibidor de la enzima convertidora de angiotensina (IECA)", principioActivo: "Maleato de enalapril", presentacion: "Tabletas", concentracion: "10mg", categoriaNombre: "Cardiovasculares" },
  { nombre: "Enalapril 20mg", descripcion: "IECA de alta dosis", principioActivo: "Maleato de enalapril", presentacion: "Tabletas", concentracion: "20mg", categoriaNombre: "Cardiovasculares" },
  { nombre: "Captopril", descripcion: "IECA de acción rápida", principioActivo: "Captopril", presentacion: "Tabletas", concentracion: "25mg", categoriaNombre: "Cardiovasculares" },
  { nombre: "Amlodipino", descripcion: "Bloqueador de canales de calcio", principioActivo: "Amlodipino besilato", presentacion: "Tabletas", concentracion: "5mg", categoriaNombre: "Cardiovasculares" },
  { nombre: "Atenolol", descripcion: "Betabloqueador selectivo", principioActivo: "Atenolol", presentacion: "Tabletas", concentracion: "50mg", categoriaNombre: "Cardiovasculares" },
  { nombre: "Metoprolol", descripcion: "Betabloqueador cardioselectivo", principioActivo: "Metoprolol succinato", presentacion: "Tabletas", concentracion: "50mg", categoriaNombre: "Cardiovasculares" },
  { nombre: "Aspirina Cardio", descripcion: "Antiagregante plaquetario de baja dosis", principioActivo: "Ácido acetilsalicílico", presentacion: "Tabletas", concentracion: "100mg", categoriaNombre: "Cardiovasculares" },
  { nombre: "Clopidogrel", descripcion: "Antiagregante plaquetario", principioActivo: "Clopidogrel bisulfato", presentacion: "Tabletas", concentracion: "75mg", categoriaNombre: "Cardiovasculares" },
  { nombre: "Atorvastatina", descripcion: "Estatina para reducir colesterol LDL", principioActivo: "Atorvastatina cálcica", presentacion: "Tabletas", concentracion: "20mg", categoriaNombre: "Cardiovasculares" },
  { nombre: "Atorvastatina 40mg", descripcion: "Estatina de alta potencia", principioActivo: "Atorvastatina cálcica", presentacion: "Tabletas", concentracion: "40mg", categoriaNombre: "Cardiovasculares" },
  { nombre: "Simvastatina", descripcion: "Estatina para control de lípidos", principioActivo: "Simvastatina", presentacion: "Tabletas", concentracion: "20mg", categoriaNombre: "Cardiovasculares" },
  { nombre: "Rosuvastatina", descripcion: "Estatina de alta eficacia", principioActivo: "Rosuvastatina cálcica", presentacion: "Tabletas", concentracion: "10mg", categoriaNombre: "Cardiovasculares" },
  { nombre: "Furosemida", descripcion: "Diurético de asa", principioActivo: "Furosemida", presentacion: "Tabletas", concentracion: "40mg", categoriaNombre: "Cardiovasculares" },
  { nombre: "Hidroclorotiazida", descripcion: "Diurético tiazida", principioActivo: "Hidroclorotiazida", presentacion: "Tabletas", concentracion: "25mg", categoriaNombre: "Cardiovasculares" },
  { nombre: "Digoxina", descripcion: "Glucósido cardíaco para arritmias", principioActivo: "Digoxina", presentacion: "Tabletas", concentracion: "0.25mg", categoriaNombre: "Cardiovasculares" },
  { nombre: "Nitroglicerina", descripcion: "Vasodilatador para angina de pecho", principioActivo: "Nitroglicerina", presentacion: "Tabletas sublinguales", concentracion: "0.4mg", categoriaNombre: "Cardiovasculares" },
  { nombre: "Warfarina", descripcion: "Anticoagulante oral", principioActivo: "Warfarina sódica", presentacion: "Tabletas", concentracion: "5mg", categoriaNombre: "Cardiovasculares" },

  // Metabólicos y Diabetes
  { nombre: "Metformina", descripcion: "Antidiabético oral biguanida", principioActivo: "Metformina clorhidrato", presentacion: "Tabletas", concentracion: "850mg", categoriaNombre: "Metabólicos y Diabetes" },
  { nombre: "Metformina 500", descripcion: "Antidiabético oral de dosis estándar", principioActivo: "Metformina clorhidrato", presentacion: "Tabletas", concentracion: "500mg", categoriaNombre: "Metabólicos y Diabetes" },
  { nombre: "Glibenclamida", descripcion: "Sulfonilurea hipoglucemiante", principioActivo: "Glibenclamida", presentacion: "Tabletas", concentracion: "5mg", categoriaNombre: "Metabólicos y Diabetes" },
  { nombre: "Glimepirida", descripcion: "Sulfonilurea de tercera generación", principioActivo: "Glimepirida", presentacion: "Tabletas", concentracion: "2mg", categoriaNombre: "Metabólicos y Diabetes" },
  { nombre: "Sitagliptina", descripcion: "Inhibidor de DPP-4", principioActivo: "Sitagliptina fosfato", presentacion: "Tabletas", concentracion: "100mg", categoriaNombre: "Metabólicos y Diabetes" },
  { nombre: "Empagliflozina", descripcion: "Inhibidor de SGLT2", principioActivo: "Empagliflozina", presentacion: "Tabletas", concentracion: "10mg", categoriaNombre: "Metabólicos y Diabetes" },
  { nombre: "Insulina Glargina (Lantus)", descripcion: "Insulina de acción prolongada", principioActivo: "Insulina glargina", presentacion: "Inyectable", concentracion: "100 UI/ml", categoriaNombre: "Metabólicos y Diabetes" },
  { nombre: "Insulina Lispro (Humalog)", descripcion: "Insulina de acción rápida", principioActivo: "Insulina lispro", presentacion: "Inyectable", concentracion: "100 UI/ml", categoriaNombre: "Metabólicos y Diabetes" },
  { nombre: "Insulina NPH", descripcion: "Insulina de acción intermedia", principioActivo: "Insulina NPH", presentacion: "Inyectable", concentracion: "100 UI/ml", categoriaNombre: "Metabólicos y Diabetes" },
  { nombre: "Insulina Regular", descripcion: "Insulina de acción corta", principioActivo: "Insulina regular humana", presentacion: "Inyectable", concentracion: "100 UI/ml", categoriaNombre: "Metabólicos y Diabetes" },
  { nombre: "Levotiroxina", descripcion: "Hormona tiroidea sintética", principioActivo: "Levotiroxina sódica", presentacion: "Tabletas", concentracion: "100mcg", categoriaNombre: "Metabólicos y Diabetes" },
  { nombre: "Levotiroxina 50mcg", descripcion: "Hormona tiroidea de dosis baja", principioActivo: "Levotiroxina sódica", presentacion: "Tabletas", concentracion: "50mcg", categoriaNombre: "Metabólicos y Diabetes" },
  { nombre: "Alopurinol", descripcion: "Reductor de ácido úrico", principioActivo: "Alopurinol", presentacion: "Tabletas", concentracion: "300mg", categoriaNombre: "Metabólicos y Diabetes" },
  { nombre: "Colchicina", descripcion: "Tratamiento de crisis de gota", principioActivo: "Colchicina", presentacion: "Tabletas", concentracion: "0.5mg", categoriaNombre: "Metabólicos y Diabetes" },

  // Gastrointestinales
  { nombre: "Omeprazol", descripcion: "Inhibidor de bomba de protones (IBP)", principioActivo: "Omeprazol", presentacion: "Cápsulas", concentracion: "20mg", categoriaNombre: "Gastrointestinales" },
  { nombre: "Omeprazol 40mg", descripcion: "IBP de alta dosis", principioActivo: "Omeprazol", presentacion: "Cápsulas", concentracion: "40mg", categoriaNombre: "Gastrointestinales" },
  { nombre: "Esomeprazol", descripcion: "IBP isómero de omeprazol", principioActivo: "Esomeprazol magnesio", presentacion: "Cápsulas", concentracion: "40mg", categoriaNombre: "Gastrointestinales" },
  { nombre: "Pantoprazol", descripcion: "IBP para reflujo y úlceras", principioActivo: "Pantoprazol sódico", presentacion: "Tabletas", concentracion: "40mg", categoriaNombre: "Gastrointestinales" },
  { nombre: "Lansoprazol", descripcion: "IBP de rápida acción", principioActivo: "Lansoprazol", presentacion: "Cápsulas", concentracion: "30mg", categoriaNombre: "Gastrointestinales" },
  { nombre: "Ranitidina", descripcion: "Antagonista H2 (bloqueador de histamina)", principioActivo: "Ranitidina clorhidrato", presentacion: "Tabletas", concentracion: "150mg", categoriaNombre: "Gastrointestinales" },
  { nombre: "Famotidina", descripcion: "Antagonista H2 para reflujo", principioActivo: "Famotidina", presentacion: "Tabletas", concentracion: "20mg", categoriaNombre: "Gastrointestinales" },
  { nombre: "Metoclopramida", descripcion: "Procinético y antiemético", principioActivo: "Metoclopramida clorhidrato", presentacion: "Tabletas", concentracion: "10mg", categoriaNombre: "Gastrointestinales" },
  { nombre: "Domperidona", descripcion: "Procinético para náuseas", principioActivo: "Domperidona", presentacion: "Tabletas", concentracion: "10mg", categoriaNombre: "Gastrointestinales" },
  { nombre: "Ondansetrón", descripcion: "Antiemético para náuseas y vómitos", principioActivo: "Ondansetrón", presentacion: "Tabletas", concentracion: "8mg", categoriaNombre: "Gastrointestinales" },
  { nombre: "Loperamida", descripcion: "Antidiarreico", principioActivo: "Loperamida clorhidrato", presentacion: "Cápsulas", concentracion: "2mg", categoriaNombre: "Gastrointestinales" },
  { nombre: "Hidróxido de Aluminio/Magnesio", descripcion: "Antiácido", principioActivo: "Al(OH)3/Mg(OH)2", presentacion: "Suspensión", concentracion: "N/A", categoriaNombre: "Gastrointestinales" },
  { nombre: "Bisacodilo", descripcion: "Laxante estimulante", principioActivo: "Bisacodilo", presentacion: "Tabletas", concentracion: "5mg", categoriaNombre: "Gastrointestinales" },
  { nombre: "Lactulosa", descripcion: "Laxante osmótico y prebiótico", principioActivo: "Lactulosa", presentacion: "Jarabe", concentracion: "667mg/ml", categoriaNombre: "Gastrointestinales" },
  { nombre: "Mesalazina", descripcion: "Antiinflamatorio intestinal", principioActivo: "Mesalazina", presentacion: "Tabletas", concentracion: "500mg", categoriaNombre: "Gastrointestinales" },
  { nombre: "Orlistat", descripcion: "Inhibidor de lipasas para obesidad", principioActivo: "Orlistat", presentacion: "Cápsulas", concentracion: "120mg", categoriaNombre: "Gastrointestinales" },

  // Respiratorios
  { nombre: "Salbutamol", descripcion: "Broncodilatador de rescate para asma", principioActivo: "Salbutamol sulfato", presentacion: "Inhalador", concentracion: "100mcg/dosis", categoriaNombre: "Respiratorios" },
  { nombre: "Salbutamol Jarabe", descripcion: "Broncodilatador en forma oral", principioActivo: "Salbutamol sulfato", presentacion: "Jarabe", concentracion: "2mg/5ml", categoriaNombre: "Respiratorios" },
  { nombre: "Budesonida", descripcion: "Corticoide inhalado para asma", principioActivo: "Budesonida", presentacion: "Inhalador", concentracion: "200mcg/dosis", categoriaNombre: "Respiratorios" },
  { nombre: "Formoterol/Budesonida", descripcion: "Combinado broncodilatador/corticoide", principioActivo: "Formoterol/Budesonida", presentacion: "Inhalador", concentracion: "6/200mcg", categoriaNombre: "Respiratorios" },
  { nombre: "Salmeterol/Fluticasona", descripcion: "Combinado de mantenimiento para asma/EPOC", principioActivo: "Salmeterol/Fluticasona", presentacion: "Inhalador", concentracion: "25/125mcg", categoriaNombre: "Respiratorios" },
  { nombre: "Ipratropio", descripcion: "Broncodilatador anticolinérgico", principioActivo: "Bromuro de ipratropio", presentacion: "Inhalador", concentracion: "20mcg/dosis", categoriaNombre: "Respiratorios" },
  { nombre: "Ambroxol", descripcion: "Mucolítico y expectorante", principioActivo: "Ambroxol clorhidrato", presentacion: "Jarabe", concentracion: "15mg/5ml", categoriaNombre: "Respiratorios" },
  { nombre: "Carbocisteína", descripcion: "Mucolítico para secreciones espesas", principioActivo: "Carbocisteína", presentacion: "Jarabe", concentracion: "250mg/5ml", categoriaNombre: "Respiratorios" },
  { nombre: "Dextrometorfano", descripcion: "Antitusivo", principioActivo: "Dextrometorfano bromhidrato", presentacion: "Jarabe", concentracion: "15mg/5ml", categoriaNombre: "Respiratorios" },
  { nombre: "Acetilcisteína", descripcion: "Mucolítico antioxidante", principioActivo: "Acetilcisteína", presentacion: "Sobres", concentracion: "600mg", categoriaNombre: "Respiratorios" },
  { nombre: "Prednisona Respiratoria", descripcion: "Corticoide oral para exacerbaciones", principioActivo: "Prednisona", presentacion: "Tabletas", concentracion: "5mg", categoriaNombre: "Respiratorios" },

  // Vitaminas y Suplementos
  { nombre: "Vitamina C", descripcion: "Ácido ascórbico, antioxidante", principioActivo: "Ácido ascórbico", presentacion: "Tabletas masticables", concentracion: "500mg", categoriaNombre: "Vitaminas y Suplementos" },
  { nombre: "Vitamina D3", descripcion: "Colecalciferol para huesos e inmunidad", principioActivo: "Colecalciferol", presentacion: "Cápsulas", concentracion: "2000 UI", categoriaNombre: "Vitaminas y Suplementos" },
  { nombre: "Complejo B", descripcion: "Vitaminas del grupo B", principioActivo: "Complejo B", presentacion: "Tabletas", concentracion: "N/A", categoriaNombre: "Vitaminas y Suplementos" },
  { nombre: "Vitamina B12", descripcion: "Cianocobalamina para nervios y sangre", principioActivo: "Cianocobalamina", presentacion: "Tabletas sublinguales", concentracion: "1000mcg", categoriaNombre: "Vitaminas y Suplementos" },
  { nombre: "Ácido Fólico", descripcion: "Vitamina B9, esencial para embarazo", principioActivo: "Ácido fólico", presentacion: "Tabletas", concentracion: "400mcg", categoriaNombre: "Vitaminas y Suplementos" },
  { nombre: "Calcio + Vitamina D", descripcion: "Suplemento óseo combinado", principioActivo: "Carbonato de calcio/Colecalciferol", presentacion: "Tabletas", concentracion: "500mg/200UI", categoriaNombre: "Vitaminas y Suplementos" },
  { nombre: "Hierro", descripcion: "Sulfato ferroso para anemia", principioActivo: "Sulfato ferroso", presentacion: "Tabletas", concentracion: "325mg", categoriaNombre: "Vitaminas y Suplementos" },
  { nombre: "Magnesio", descripcion: "Suplemento mineral", principioActivo: "Óxido de magnesio", presentacion: "Tabletas", concentracion: "400mg", categoriaNombre: "Vitaminas y Suplementos" },
  { nombre: "Zinc", descripcion: "Suplemento para inmunidad", principioActivo: "Sulfato de zinc", presentacion: "Tabletas", concentracion: "50mg", categoriaNombre: "Vitaminas y Suplementos" },
  { nombre: "Multivitamínico", descripcion: "Combinado de vitaminas y minerales", principioActivo: "Multivitamínico", presentacion: "Tabletas", concentracion: "N/A", categoriaNombre: "Vitaminas y Suplementos" },
  { nombre: "Omega-3", descripcion: "Ácidos grasos esenciales", principioActivo: "EPA/DHA", presentacion: "Cápsulas", concentracion: "1000mg", categoriaNombre: "Vitaminas y Suplementos" },
  { nombre: "Probióticos", descripcion: "Bacterias beneficiosas para flora intestinal", principioActivo: "Lactobacillus/Bifidobacterium", presentacion: "Cápsulas", concentracion: "N/A", categoriaNombre: "Vitaminas y Suplementos" },

  // Sistema Nervioso
  { nombre: "Sertralina", descripcion: "Antidepresivo ISRS", principioActivo: "Sertralina clorhidrato", presentacion: "Tabletas", concentracion: "50mg", categoriaNombre: "Sistema Nervioso" },
  { nombre: "Fluoxetina", descripcion: "Antidepresivo ISRS", principioActivo: "Fluoxetina clorhidrato", presentacion: "Cápsulas", concentracion: "20mg", categoriaNombre: "Sistema Nervioso" },
  { nombre: "Escitalopram", descripcion: "Antidepresivo ISRS", principioActivo: "Escitalopram oxalato", presentacion: "Tabletas", concentracion: "10mg", categoriaNombre: "Sistema Nervioso" },
  { nombre: "Amitriptilina", descripcion: "Antidepresivo tricíclico", principioActivo: "Amitriptilina clorhidrato", presentacion: "Tabletas", concentracion: "25mg", categoriaNombre: "Sistema Nervioso" },
  { nombre: "Clonazepam", descripcion: "Benzodiazepina ansiolítica y anticonvulsivante", principioActivo: "Clonazepam", presentacion: "Tabletas", concentracion: "0.5mg", categoriaNombre: "Sistema Nervioso" },
  { nombre: "Clonazepam 2mg", descripcion: "Benzodiazepina de alta dosis", principioActivo: "Clonazepam", presentacion: "Tabletas", concentracion: "2mg", categoriaNombre: "Sistema Nervioso" },
  { nombre: "Lorazepam", descripcion: "Benzodiazepina ansiolítica de acción corta", principioActivo: "Lorazepam", presentacion: "Tabletas", concentracion: "1mg", categoriaNombre: "Sistema Nervioso" },
  { nombre: "Diazepam", descripcion: "Benzodiazepina ansiolítica", principioActivo: "Diazepam", presentacion: "Tabletas", concentracion: "10mg", categoriaNombre: "Sistema Nervioso" },
  { nombre: "Alprazolam", descripcion: "Benzodiazepina para trastornos de ansiedad", principioActivo: "Alprazolam", presentacion: "Tabletas", concentracion: "0.5mg", categoriaNombre: "Sistema Nervioso" },
  { nombre: "Carbamazepina", descripcion: "Anticonvulsivante y estabilizador del estado de ánimo", principioActivo: "Carbamazepina", presentacion: "Tabletas", concentracion: "200mg", categoriaNombre: "Sistema Nervioso" },
  { nombre: "Ácido Valpróico", descripcion: "Anticonvulsivante y estabilizador del estado de ánimo", principioActivo: "Ácido valpróico", presentacion: "Tabletas", concentracion: "500mg", categoriaNombre: "Sistema Nervioso" },
  { nombre: "Levetiracetam", descripcion: "Anticonvulsivante de amplio espectro", principioActivo: "Levetiracetam", presentacion: "Tabletas", concentracion: "500mg", categoriaNombre: "Sistema Nervioso" },
  { nombre: "Gabapentina", descripcion: "Anticonvulsivante y analgésico neuropático", principioActivo: "Gabapentina", presentacion: "Cápsulas", concentracion: "300mg", categoriaNombre: "Sistema Nervioso" },
  { nombre: "Pregabalina", descripcion: "Analgésico neuropático", principioActivo: "Pregabalina", presentacion: "Cápsulas", concentracion: "75mg", categoriaNombre: "Sistema Nervioso" },
  { nombre: "Risperidona", descripcion: "Antipsicótico atípico", principioActivo: "Risperidona", presentacion: "Tabletas", concentracion: "2mg", categoriaNombre: "Sistema Nervioso" },
  { nombre: "Olanzapina", descripcion: "Antipsicótico atípico", principioActivo: "Olanzapina", presentacion: "Tabletas", concentracion: "5mg", categoriaNombre: "Sistema Nervioso" },
  { nombre: "Quetiapina", descripcion: "Antipsicótico atípico", principioActivo: "Quetiapina fumarato", presentacion: "Tabletas", concentracion: "25mg", categoriaNombre: "Sistema Nervioso" },
  { nombre: "Levodopa/Carbidopa", descripcion: "Tratamiento de Parkinson", principioActivo: "Levodopa/Carbidopa", presentacion: "Tabletas", concentracion: "250/25mg", categoriaNombre: "Sistema Nervioso" },
  { nombre: "Donepezilo", descripcion: "Inhibidor de colinesterasa para Alzheimer", principioActivo: "Donepezilo clorhidrato", presentacion: "Tabletas", concentracion: "10mg", categoriaNombre: "Sistema Nervioso" },
  { nombre: "Sumatriptán", descripcion: "Tratamiento agudo de migraña", principioActivo: "Sumatriptán succinato", presentacion: "Tabletas", concentracion: "100mg", categoriaNombre: "Sistema Nervioso" },
  { nombre: "Melatonina", descripcion: "Regulador del sueño", principioActivo: "Melatonina", presentacion: "Tabletas", concentracion: "3mg", categoriaNombre: "Sistema Nervioso" },

  // Dermatológicos
  { nombre: "Clotrimazol Tópico", descripcion: "Antifúngico para piel", principioActivo: "Clotrimazol", presentacion: "Crema", concentracion: "1%", categoriaNombre: "Dermatológicos" },
  { nombre: "Miconazol", descripcion: "Antifúngico para dermatitis y pie de atleta", principioActivo: "Miconazol nitrato", presentacion: "Crema", concentracion: "2%", categoriaNombre: "Dermatológicos" },
  { nombre: "Ketoconazol Shampoo", descripcion: "Antifúngico para caspa y dermatitis seborreica", principioActivo: "Ketoconazol", presentacion: "Shampoo", concentracion: "2%", categoriaNombre: "Dermatológicos" },
  { nombre: "Betametasona", descripcion: "Corticoide tópico de alta potencia", principioActivo: "Betametasona dipropionato", presentacion: "Crema", concentracion: "0.05%", categoriaNombre: "Dermatológicos" },
  { nombre: "Dexametasona Tópica", descripcion: "Corticoide para inflamación cutánea", principioActivo: "Dexametasona", presentacion: "Crema", concentracion: "0.1%", categoriaNombre: "Dermatológicos" },
  { nombre: "Gentamicina Tópica", descripcion: "Antibiótico tópico", principioActivo: "Gentamicina sulfato", presentacion: "Crema", concentracion: "0.1%", categoriaNombre: "Dermatológicos" },
  { nombre: "Mupirocina", descripcion: "Antibiótico tópico para impétigo", principioActivo: "Mupirocina", presentacion: "Crema", concentracion: "2%", categoriaNombre: "Dermatológicos" },
  { nombre: "Permetrina", descripcion: "Antiparasitario para escabiosis y piojos", principioActivo: "Permetrina", presentacion: "Crema", concentracion: "5%", categoriaNombre: "Dermatológicos" },
  { nombre: "Calamina", descripcion: "Alivio de picazón y erupciones", principioActivo: "Calamina", presentacion: "Loción", concentracion: "N/A", categoriaNombre: "Dermatológicos" },
  { nombre: "Ácido Fusídico", descripcion: "Antibiótico tópico", principioActivo: "Ácido fusídico", presentacion: "Crema", concentracion: "2%", categoriaNombre: "Dermatológicos" },
  { nombre: "Isotretinoína", descripcion: "Retinoide oral para acné severo", principioActivo: "Isotretinoína", presentacion: "Cápsulas", concentracion: "20mg", categoriaNombre: "Dermatológicos" },
  { nombre: "Adapaleno", descripcion: "Retinoide tópico para acné", principioActivo: "Adapaleno", presentacion: "Gel", concentracion: "0.1%", categoriaNombre: "Dermatológicos" },
  { nombre: "Benzoyl Peroxide", descripcion: "Antibacteriano tópico para acné", principioActivo: "Peróxido de benzoílo", presentacion: "Gel", concentracion: "5%", categoriaNombre: "Dermatológicos" },
  { nombre: "Aciclovir Tópico", descripcion: "Antiviral para herpes labial", principioActivo: "Aciclovir", presentacion: "Crema", concentracion: "5%", categoriaNombre: "Dermatológicos" },

  // Oftálmicos
  { nombre: "Tobramicina Oftálmica", descripcion: "Antibiótico para infecciones oculares", principioActivo: "Tobramicina", presentacion: "Colirio", concentracion: "0.3%", categoriaNombre: "Oftálmicos" },
  { nombre: "Gentamicina Oftálmica", descripcion: "Antibiótico para infecciones oculares", principioActivo: "Gentamicina sulfato", presentacion: "Colirio", concentracion: "0.3%", categoriaNombre: "Oftálmicos" },
  { nombre: "Ciprofloxacino Oftálmico", descripcion: "Antibiótico de amplio espectro ocular", principioActivo: "Ciprofloxacino", presentacion: "Colirio", concentracion: "0.3%", categoriaNombre: "Oftálmicos" },
  { nombre: "Diclofenaco Oftálmico", descripcion: "Antiinflamatorio para ojos", principioActivo: "Diclofenaco sódico", presentacion: "Colirio", concentracion: "0.1%", categoriaNombre: "Oftálmicos" },
  { nombre: "Ketotifeno Oftálmico", descripcion: "Antihistamínico para ojos alérgicos", principioActivo: "Ketotifeno fumarato", presentacion: "Colirio", concentracion: "0.025%", categoriaNombre: "Oftálmicos" },
  { nombre: "Hialuronato de Sodio", descripcion: "Lágrimas artificiales", principioActivo: "Hialuronato de sodio", presentacion: "Colirio", concentracion: "0.2%", categoriaNombre: "Oftálmicos" },
  { nombre: "Tetrahidrozolina", descripcion: "Descongestionante ocular", principioActivo: "Tetrahidrozolina clorhidrato", presentacion: "Colirio", concentracion: "0.05%", categoriaNombre: "Oftálmicos" },
  { nombre: "Brimonidina", descripcion: "Reductor de presión intraocular", principioActivo: "Brimonidina tartrato", presentacion: "Colirio", concentracion: "0.2%", categoriaNombre: "Oftálmicos" },
  { nombre: "Timolol Oftálmico", descripcion: "Betabloqueador para glaucoma", principioActivo: "Timolol maleato", presentacion: "Colirio", concentracion: "0.5%", categoriaNombre: "Oftálmicos" },
  { nombre: "Latanoprost", descripcion: "Análogo de prostaglandina para glaucoma", principioActivo: "Latanoprost", presentacion: "Colirio", concentracion: "0.005%", categoriaNombre: "Oftálmicos" },
]
