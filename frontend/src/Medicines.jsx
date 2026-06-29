import { useEffect, useState, useMemo } from "react";
import { api } from "./api";
import ThemeToggle from "./ThemeToggle";
import "./Medicines.css";

const CATEGORIES = [
  "All",
  "Medicines",
  "Vitamins & Supplements",
  "Baby Care",
  "Medical Devices",
  "First Aid",
  "Personal Care",
  "Dental Care",
  "Nutrition",
];

// 120 products — static data so the shop works without a backend restart
const ALL_PRODUCTS = [
  // ── Medicines ─────────────────────────────────────────────────────────
  { id:1,  name:"Napa 500mg",              category:"Medicines",               brand:"Beximco",          description:"Fast-acting paracetamol for fever, headache and mild pain relief",                                         price:25,   original_price:null, unit:"10 tablets",      emoji:"💊", requires_prescription:false, rating:4.7, reviews_count:1240, is_featured:true  },
  { id:2,  name:"Napa Extra",              category:"Medicines",               brand:"Beximco",          description:"Paracetamol + caffeine for stronger headache and migraine relief",                                          price:35,   original_price:null, unit:"10 tablets",      emoji:"💊", requires_prescription:false, rating:4.6, reviews_count:980,  is_featured:true  },
  { id:3,  name:"Ibuprofen 400mg",         category:"Medicines",               brand:"Square",           description:"Anti-inflammatory and analgesic for pain, fever and inflammation",                                          price:30,   original_price:null, unit:"10 tablets",      emoji:"💊", requires_prescription:false, rating:4.5, reviews_count:760,  is_featured:false },
  { id:4,  name:"Aspirin 75mg",            category:"Medicines",               brand:"Opsonin",          description:"Low-dose aspirin for cardiovascular protection and anti-platelet therapy",                                   price:20,   original_price:null, unit:"30 tablets",      emoji:"💊", requires_prescription:false, rating:4.4, reviews_count:540,  is_featured:false },
  { id:5,  name:"Amoxicillin 500mg",       category:"Medicines",               brand:"ACI",              description:"Broad-spectrum penicillin antibiotic for bacterial infections",                                              price:60,   original_price:null, unit:"10 capsules",     emoji:"💊", requires_prescription:true,  rating:4.6, reviews_count:820,  is_featured:false },
  { id:6,  name:"Azithromycin 500mg",      category:"Medicines",               brand:"Incepta",          description:"Macrolide antibiotic for respiratory tract and skin infections",                                             price:80,   original_price:null, unit:"3 tablets",       emoji:"💊", requires_prescription:true,  rating:4.7, reviews_count:1100, is_featured:true  },
  { id:7,  name:"Metronidazole 400mg",     category:"Medicines",               brand:"Square",           description:"Antibiotic and antiprotozoal for gastrointestinal and gynaecological infections",                            price:40,   original_price:null, unit:"10 tablets",      emoji:"💊", requires_prescription:true,  rating:4.4, reviews_count:620,  is_featured:false },
  { id:8,  name:"Cetirizine 10mg",         category:"Medicines",               brand:"Beximco",          description:"Non-drowsy antihistamine for allergic rhinitis, urticaria and hay fever",                                    price:30,   original_price:null, unit:"10 tablets",      emoji:"💊", requires_prescription:false, rating:4.6, reviews_count:890,  is_featured:false },
  { id:9,  name:"Loratadine 10mg",         category:"Medicines",               brand:"ACI",              description:"Second-generation antihistamine for allergy relief without sedation",                                        price:35,   original_price:null, unit:"10 tablets",      emoji:"💊", requires_prescription:false, rating:4.5, reviews_count:670,  is_featured:false },
  { id:10, name:"Omeprazole 20mg",         category:"Medicines",               brand:"Square",           description:"Proton pump inhibitor for gastric ulcers and acid reflux",                                                   price:45,   original_price:55,   unit:"10 capsules",     emoji:"💊", requires_prescription:true,  rating:4.7, reviews_count:1020, is_featured:true  },
  { id:11, name:"Ranitidine 150mg",        category:"Medicines",               brand:"Opsonin",          description:"H2 blocker for heartburn, acid indigestion and gastritis",                                                   price:25,   original_price:null, unit:"10 tablets",      emoji:"💊", requires_prescription:false, rating:4.3, reviews_count:480,  is_featured:false },
  { id:12, name:"Pantoprazole 40mg",       category:"Medicines",               brand:"Incepta",          description:"Proton pump inhibitor for gastroesophageal reflux and erosive oesophagitis",                                 price:55,   original_price:null, unit:"10 tablets",      emoji:"💊", requires_prescription:true,  rating:4.6, reviews_count:740,  is_featured:false },
  { id:13, name:"Domperidone 10mg",        category:"Medicines",               brand:"ACI",              description:"Anti-nausea and prokinetic agent for vomiting and stomach motility",                                          price:35,   original_price:null, unit:"10 tablets",      emoji:"💊", requires_prescription:true,  rating:4.4, reviews_count:560,  is_featured:false },
  { id:14, name:"Metformin 500mg",         category:"Medicines",               brand:"Square",           description:"First-line oral medication for type 2 diabetes mellitus",                                                    price:25,   original_price:null, unit:"10 tablets",      emoji:"💊", requires_prescription:true,  rating:4.7, reviews_count:1380, is_featured:true  },
  { id:15, name:"Losartan 50mg",           category:"Medicines",               brand:"Beximco",          description:"Angiotensin receptor blocker for hypertension and kidney protection",                                         price:50,   original_price:null, unit:"10 tablets",      emoji:"💊", requires_prescription:true,  rating:4.6, reviews_count:820,  is_featured:false },
  { id:16, name:"Amlodipine 5mg",          category:"Medicines",               brand:"Incepta",          description:"Calcium channel blocker for high blood pressure and angina",                                                  price:40,   original_price:null, unit:"10 tablets",      emoji:"💊", requires_prescription:true,  rating:4.5, reviews_count:760,  is_featured:false },
  { id:17, name:"Atorvastatin 20mg",       category:"Medicines",               brand:"ACI",              description:"Statin medication for lowering cholesterol and cardiovascular risk",                                           price:70,   original_price:85,   unit:"10 tablets",      emoji:"💊", requires_prescription:true,  rating:4.7, reviews_count:960,  is_featured:false },
  { id:18, name:"ORS Saline Powder",       category:"Medicines",               brand:"ICDDRB",           description:"Oral rehydration salts for dehydration from diarrhoea and vomiting",                                          price:15,   original_price:null, unit:"10 sachets",      emoji:"💊", requires_prescription:false, rating:4.8, reviews_count:2100, is_featured:true  },
  { id:19, name:"Antacid Syrup 200ml",     category:"Medicines",               brand:"Square",           description:"Antacid suspension for quick relief from acidity and heartburn",                                              price:90,   original_price:110,  unit:"200 ml bottle",   emoji:"🧴", requires_prescription:false, rating:4.5, reviews_count:680,  is_featured:false },
  { id:20, name:"Benadryl Cough Syrup",    category:"Medicines",               brand:"Johnson & Johnson", description:"Diphenhydramine-based cough suppressant for dry and wet cough",                                              price:120,  original_price:null, unit:"100 ml bottle",   emoji:"🧴", requires_prescription:false, rating:4.4, reviews_count:580,  is_featured:false },
  { id:21, name:"Ciprofloxacin 500mg",     category:"Medicines",               brand:"Square",           description:"Fluoroquinolone antibiotic for urinary tract and respiratory infections",                                     price:65,   original_price:null, unit:"10 tablets",      emoji:"💊", requires_prescription:true,  rating:4.5, reviews_count:640,  is_featured:false },
  { id:22, name:"Doxycycline 100mg",       category:"Medicines",               brand:"Opsonin",          description:"Tetracycline antibiotic for acne, malaria prophylaxis and STIs",                                              price:55,   original_price:null, unit:"10 capsules",     emoji:"💊", requires_prescription:true,  rating:4.4, reviews_count:510,  is_featured:false },
  { id:23, name:"Fluconazole 150mg",       category:"Medicines",               brand:"Incepta",          description:"Antifungal for vaginal candidiasis and other fungal infections",                                              price:45,   original_price:null, unit:"1 capsule",       emoji:"💊", requires_prescription:true,  rating:4.6, reviews_count:720,  is_featured:false },
  { id:24, name:"Loperamide 2mg",          category:"Medicines",               brand:"Beximco",          description:"Anti-diarrhoeal for acute and chronic diarrhoea",                                                            price:25,   original_price:null, unit:"10 capsules",     emoji:"💊", requires_prescription:false, rating:4.5, reviews_count:590,  is_featured:false },
  { id:25, name:"Mebendazole 100mg",       category:"Medicines",               brand:"ACI",              description:"Anthelmintic for intestinal worm infections including threadworms",                                            price:30,   original_price:null, unit:"6 tablets",       emoji:"💊", requires_prescription:false, rating:4.6, reviews_count:680,  is_featured:false },
  { id:26, name:"Naproxen 500mg",          category:"Medicines",               brand:"Square",           description:"NSAID for musculoskeletal pain, arthritis and dysmenorrhoea",                                                 price:45,   original_price:null, unit:"10 tablets",      emoji:"💊", requires_prescription:false, rating:4.4, reviews_count:490,  is_featured:false },
  { id:27, name:"Ondansetron 4mg",         category:"Medicines",               brand:"Beximco",          description:"Antiemetic for nausea and vomiting from chemotherapy and surgery",                                            price:55,   original_price:null, unit:"10 tablets",      emoji:"💊", requires_prescription:true,  rating:4.7, reviews_count:830,  is_featured:false },
  { id:28, name:"Prednisolone 5mg",        category:"Medicines",               brand:"Incepta",          description:"Corticosteroid for inflammatory and autoimmune conditions",                                                   price:30,   original_price:null, unit:"10 tablets",      emoji:"💊", requires_prescription:true,  rating:4.5, reviews_count:610,  is_featured:false },
  { id:29, name:"Salbutamol Inhaler",      category:"Medicines",               brand:"ACI",              description:"Bronchodilator inhaler for rapid asthma and COPD symptom relief",                                             price:180,  original_price:220,  unit:"200 doses",       emoji:"💊", requires_prescription:true,  rating:4.8, reviews_count:1450, is_featured:true  },
  { id:30, name:"Metoclopramide 10mg",     category:"Medicines",               brand:"Opsonin",          description:"Prokinetic antiemetic for nausea, vomiting and gastroparesis",                                               price:25,   original_price:null, unit:"10 tablets",      emoji:"💊", requires_prescription:true,  rating:4.3, reviews_count:420,  is_featured:false },
  // ── Vitamins & Supplements ────────────────────────────────────────────
  { id:31, name:"Vitamin C 500mg",         category:"Vitamins & Supplements",  brand:"Square",           description:"Ascorbic acid antioxidant for immune support and collagen synthesis",                                         price:180,  original_price:220,  unit:"60 tablets",      emoji:"🌿", requires_prescription:false, rating:4.8, reviews_count:1820, is_featured:true  },
  { id:32, name:"Vitamin D3 1000IU",       category:"Vitamins & Supplements",  brand:"Beximco",          description:"Cholecalciferol for bone health, immune function and mood support",                                           price:220,  original_price:270,  unit:"60 tablets",      emoji:"🌿", requires_prescription:false, rating:4.7, reviews_count:1340, is_featured:true  },
  { id:33, name:"Calcium + D3",            category:"Vitamins & Supplements",  brand:"ACI",              description:"Combined calcium carbonate and vitamin D3 for strong bones and teeth",                                        price:250,  original_price:300,  unit:"60 tablets",      emoji:"🌿", requires_prescription:false, rating:4.6, reviews_count:980,  is_featured:false },
  { id:34, name:"Folic Acid 5mg",          category:"Vitamins & Supplements",  brand:"Square",           description:"Essential B-vitamin for pregnancy and neural tube defect prevention",                                          price:60,   original_price:null, unit:"30 tablets",      emoji:"🌿", requires_prescription:false, rating:4.7, reviews_count:1120, is_featured:false },
  { id:35, name:"Iron + Folic Acid",       category:"Vitamins & Supplements",  brand:"Opsonin",          description:"Combined iron and folic acid for anaemia treatment and prevention",                                            price:80,   original_price:95,   unit:"30 tablets",      emoji:"🌿", requires_prescription:false, rating:4.6, reviews_count:890,  is_featured:false },
  { id:36, name:"Multivitamin Adults",     category:"Vitamins & Supplements",  brand:"Incepta",          description:"Complete daily multivitamin with 23 essential vitamins and minerals",                                          price:290,  original_price:350,  unit:"30 tablets",      emoji:"🌿", requires_prescription:false, rating:4.7, reviews_count:1560, is_featured:true  },
  { id:37, name:"Zinc 20mg",               category:"Vitamins & Supplements",  brand:"ACI",              description:"Zinc supplement for immune support, wound healing and skin health",                                             price:150,  original_price:180,  unit:"30 tablets",      emoji:"🌿", requires_prescription:false, rating:4.5, reviews_count:720,  is_featured:false },
  { id:38, name:"B-Complex Forte",         category:"Vitamins & Supplements",  brand:"Beximco",          description:"Complete B-vitamin complex for energy metabolism and nervous system health",                                   price:120,  original_price:150,  unit:"30 tablets",      emoji:"🌿", requires_prescription:false, rating:4.6, reviews_count:840,  is_featured:false },
  { id:39, name:"Omega-3 Fish Oil 1000mg", category:"Vitamins & Supplements",  brand:"Square",           description:"High-potency EPA and DHA fish oil for heart, brain and joint health",                                          price:380,  original_price:450,  unit:"60 softgels",     emoji:"🌿", requires_prescription:false, rating:4.8, reviews_count:2100, is_featured:true  },
  { id:40, name:"Biotin 5000mcg",          category:"Vitamins & Supplements",  brand:"Incepta",          description:"High-dose biotin for hair growth, stronger nails and skin health",                                             price:320,  original_price:380,  unit:"60 tablets",      emoji:"🌿", requires_prescription:false, rating:4.7, reviews_count:1680, is_featured:true  },
  { id:41, name:"Vitamin B12 500mcg",      category:"Vitamins & Supplements",  brand:"ACI",              description:"Methylcobalamin for nerve health, red blood cell production and energy",                                       price:180,  original_price:220,  unit:"30 tablets",      emoji:"🌿", requires_prescription:false, rating:4.6, reviews_count:920,  is_featured:false },
  { id:42, name:"Magnesium 400mg",         category:"Vitamins & Supplements",  brand:"Beximco",          description:"Magnesium glycinate for muscle relaxation, sleep and stress reduction",                                        price:280,  original_price:330,  unit:"60 tablets",      emoji:"🌿", requires_prescription:false, rating:4.5, reviews_count:760,  is_featured:false },
  { id:43, name:"Coenzyme Q10 100mg",      category:"Vitamins & Supplements",  brand:"Square",           description:"Cellular energy booster and antioxidant for heart health",                                                    price:590,  original_price:680,  unit:"30 softgels",     emoji:"🌿", requires_prescription:false, rating:4.7, reviews_count:580,  is_featured:false },
  { id:44, name:"Turmeric Curcumin 500mg", category:"Vitamins & Supplements",  brand:"Herbal Plus",      description:"Anti-inflammatory curcumin extract with black pepper for bioavailability",                                    price:350,  original_price:420,  unit:"60 capsules",     emoji:"🌿", requires_prescription:false, rating:4.6, reviews_count:840,  is_featured:false },
  { id:45, name:"Ashwagandha 500mg",       category:"Vitamins & Supplements",  brand:"Herbal Plus",      description:"Adaptogenic herb for stress relief, energy and cognitive support",                                             price:420,  original_price:490,  unit:"60 capsules",     emoji:"🌿", requires_prescription:false, rating:4.7, reviews_count:1020, is_featured:false },
  { id:46, name:"Probiotics 10 Billion",   category:"Vitamins & Supplements",  brand:"ACI",              description:"Multi-strain probiotic for gut health, digestion and immunity",                                               price:480,  original_price:560,  unit:"30 capsules",     emoji:"🌿", requires_prescription:false, rating:4.8, reviews_count:1240, is_featured:true  },
  { id:47, name:"Vitamin E 400IU",         category:"Vitamins & Supplements",  brand:"Incepta",          description:"Tocopherol antioxidant for skin health and immune function",                                                  price:260,  original_price:310,  unit:"60 softgels",     emoji:"🌿", requires_prescription:false, rating:4.5, reviews_count:640,  is_featured:false },
  { id:48, name:"Melatonin 3mg",           category:"Vitamins & Supplements",  brand:"Square",           description:"Natural sleep hormone for insomnia, jet lag and sleep cycle regulation",                                      price:290,  original_price:350,  unit:"60 tablets",      emoji:"🌿", requires_prescription:false, rating:4.6, reviews_count:980,  is_featured:false },
  { id:49, name:"Glucosamine + Chondroitin",category:"Vitamins & Supplements", brand:"Beximco",          description:"Joint support supplement for arthritis, cartilage repair and mobility",                                       price:520,  original_price:620,  unit:"60 tablets",      emoji:"🌿", requires_prescription:false, rating:4.5, reviews_count:720,  is_featured:false },
  { id:50, name:"Evening Primrose Oil",    category:"Vitamins & Supplements",  brand:"Herbal Plus",      description:"GLA-rich oil for hormonal balance, PMS relief and skin health",                                               price:450,  original_price:520,  unit:"60 softgels",     emoji:"🌿", requires_prescription:false, rating:4.5, reviews_count:560,  is_featured:false },
  // ── Baby Care ─────────────────────────────────────────────────────────
  { id:51, name:"Johnson's Baby Lotion",   category:"Baby Care",               brand:"Johnson & Johnson", description:"Clinically proven mild moisturising lotion with no parabens or dyes",                                         price:280,  original_price:320,  unit:"200 ml",          emoji:"👶", requires_prescription:false, rating:4.8, reviews_count:2400, is_featured:true  },
  { id:52, name:"Johnson's Baby Powder",   category:"Baby Care",               brand:"Johnson & Johnson", description:"Soft talc-free baby powder to keep baby skin dry and comfortable",                                            price:180,  original_price:210,  unit:"100 g",           emoji:"👶", requires_prescription:false, rating:4.7, reviews_count:1860, is_featured:false },
  { id:53, name:"Johnson's Baby Shampoo",  category:"Baby Care",               brand:"Johnson & Johnson", description:"No more tears formula gentle shampoo for delicate baby hair and scalp",                                       price:250,  original_price:290,  unit:"200 ml",          emoji:"👶", requires_prescription:false, rating:4.8, reviews_count:2100, is_featured:true  },
  { id:54, name:"Pampers Newborn S",       category:"Baby Care",               brand:"Pampers",           description:"Soft breathable newborn diapers with wetness indicator (0–5 kg)",                                             price:550,  original_price:620,  unit:"32 pieces",       emoji:"👶", requires_prescription:false, rating:4.8, reviews_count:3200, is_featured:true  },
  { id:55, name:"Pampers Baby Dry M",      category:"Baby Care",               brand:"Pampers",           description:"Overnight protection diapers keeping baby dry up to 12 hours (6–11 kg)",                                     price:620,  original_price:700,  unit:"30 pieces",       emoji:"👶", requires_prescription:false, rating:4.8, reviews_count:2900, is_featured:true  },
  { id:56, name:"Pampers Baby Dry L",      category:"Baby Care",               brand:"Pampers",           description:"Larger size diapers with 12-hour dryness protection (11–16 kg)",                                             price:680,  original_price:760,  unit:"28 pieces",       emoji:"👶", requires_prescription:false, rating:4.7, reviews_count:2600, is_featured:false },
  { id:57, name:"Huggies Baby Wipes",      category:"Baby Care",               brand:"Huggies",           description:"Fragrance-free hypoallergenic wipes with aloe vera for sensitive skin",                                       price:180,  original_price:210,  unit:"80 wipes",        emoji:"👶", requires_prescription:false, rating:4.7, reviews_count:1920, is_featured:false },
  { id:58, name:"NAN Pro 1 Infant Formula",category:"Baby Care",               brand:"Nestle",            description:"Starter formula with probiotics and whey protein (0–6 months)",                                               price:890,  original_price:980,  unit:"400 g tin",       emoji:"🍼", requires_prescription:false, rating:4.8, reviews_count:1680, is_featured:true  },
  { id:59, name:"Johnson's Baby Oil",      category:"Baby Care",               brand:"Johnson & Johnson", description:"Gentle mineral oil blend for relaxing baby massage and moisturisation",                                       price:160,  original_price:190,  unit:"100 ml",          emoji:"👶", requires_prescription:false, rating:4.6, reviews_count:1340, is_featured:false },
  { id:60, name:"Woodward's Gripe Water",  category:"Baby Care",               brand:"Woodward",          description:"Herbal formula for infant colic, gas and stomach discomfort",                                                 price:220,  original_price:260,  unit:"150 ml",          emoji:"🍼", requires_prescription:false, rating:4.6, reviews_count:1580, is_featured:false },
  { id:61, name:"Pediatric ORS Orange",    category:"Baby Care",               brand:"ICDDRB",            description:"Child-friendly flavoured oral rehydration salts for diarrhoea",                                               price:90,   original_price:null, unit:"5 sachets",       emoji:"🍼", requires_prescription:false, rating:4.7, reviews_count:1240, is_featured:false },
  { id:62, name:"Baby Nappy Rash Cream",   category:"Baby Care",               brand:"Sudocrem",          description:"Zinc oxide cream for preventing and treating nappy rash and skin irritation",                                 price:195,  original_price:230,  unit:"60 g",            emoji:"👶", requires_prescription:false, rating:4.7, reviews_count:1460, is_featured:false },
  { id:63, name:"Baby Saline Nasal Drops", category:"Baby Care",               brand:"Sterimar",          description:"Isotonic saline drops for clearing blocked noses in infants and toddlers",                                   price:120,  original_price:145,  unit:"10 ml",           emoji:"👶", requires_prescription:false, rating:4.5, reviews_count:980,  is_featured:false },
  { id:64, name:"Vitamin D Drops Infant",  category:"Baby Care",               brand:"ACI",               description:"Liquid vitamin D3 400IU for breastfed infant bone and immune development",                                   price:280,  original_price:330,  unit:"30 ml",           emoji:"🍼", requires_prescription:false, rating:4.8, reviews_count:1120, is_featured:true  },
  { id:65, name:"Baby Digital Thermometer",category:"Baby Care",               brand:"Braun",             description:"Fast 10-second underarm thermometer with flexible tip for infant safety",                                     price:350,  original_price:420,  unit:"1 piece",         emoji:"🌡️", requires_prescription:false, rating:4.7, reviews_count:860,  is_featured:false },
  // ── Medical Devices ───────────────────────────────────────────────────
  { id:66, name:"Digital Thermometer",     category:"Medical Devices",         brand:"Omron",             description:"Fast and accurate 60-second underarm and oral digital thermometer",                                           price:280,  original_price:340,  unit:"1 piece",         emoji:"🌡️", requires_prescription:false, rating:4.7, reviews_count:1680, is_featured:true  },
  { id:67, name:"Blood Pressure Monitor",  category:"Medical Devices",         brand:"Omron",             description:"Automatic upper arm BP monitor with irregular heartbeat detection",                                           price:1850, original_price:2200, unit:"1 device",        emoji:"🩺", requires_prescription:false, rating:4.8, reviews_count:2400, is_featured:true  },
  { id:68, name:"Glucometer Starter Kit",  category:"Medical Devices",         brand:"Accu-Chek",         description:"Blood glucose monitor with 10 test strips and lancing device",                                               price:1200, original_price:1450, unit:"1 kit",           emoji:"🩺", requires_prescription:false, rating:4.8, reviews_count:1860, is_featured:true  },
  { id:69, name:"Pulse Oximeter",          category:"Medical Devices",         brand:"Beurer",            description:"Fingertip pulse oximeter for SpO2 and heart rate monitoring",                                               price:790,  original_price:950,  unit:"1 piece",         emoji:"🩺", requires_prescription:false, rating:4.7, reviews_count:1540, is_featured:true  },
  { id:70, name:"Nebulizer Machine",       category:"Medical Devices",         brand:"Omron",             description:"Compressor nebulizer for asthma, COPD and upper respiratory treatments",                                     price:3200, original_price:3800, unit:"1 device",        emoji:"🩺", requires_prescription:false, rating:4.8, reviews_count:980,  is_featured:false },
  { id:71, name:"Glucose Test Strips 50",  category:"Medical Devices",         brand:"Accu-Chek",         description:"Compatible test strips for accurate blood glucose measurement",                                              price:650,  original_price:780,  unit:"50 strips",       emoji:"🩺", requires_prescription:false, rating:4.7, reviews_count:1240, is_featured:false },
  { id:72, name:"Lancets 100pcs",          category:"Medical Devices",         brand:"OneTouch",          description:"Sterile single-use lancets for pain-free blood glucose sampling",                                            price:220,  original_price:260,  unit:"100 pieces",      emoji:"🩺", requires_prescription:false, rating:4.6, reviews_count:920,  is_featured:false },
  { id:73, name:"Electric Heating Pad",    category:"Medical Devices",         brand:"Omron",             description:"6 temperature settings heating pad for muscle and joint pain relief",                                        price:890,  original_price:1050, unit:"1 piece",         emoji:"🩺", requires_prescription:false, rating:4.6, reviews_count:780,  is_featured:false },
  { id:74, name:"Reusable Ice Pack",       category:"Medical Devices",         brand:"Generic",           description:"Flexible gel ice pack for cold therapy and post-injury swelling reduction",                                  price:280,  original_price:330,  unit:"1 piece",         emoji:"🧊", requires_prescription:false, rating:4.4, reviews_count:540,  is_featured:false },
  { id:75, name:"Wrist Support Brace",     category:"Medical Devices",         brand:"Futuro",            description:"Adjustable wrist brace for carpal tunnel syndrome and wrist injuries",                                       price:380,  original_price:450,  unit:"1 piece",         emoji:"🩺", requires_prescription:false, rating:4.5, reviews_count:680,  is_featured:false },
  { id:76, name:"Knee Support Brace",      category:"Medical Devices",         brand:"Futuro",            description:"Compression knee sleeve for knee pain, arthritis and sports injuries",                                       price:490,  original_price:580,  unit:"1 piece",         emoji:"🩺", requires_prescription:false, rating:4.6, reviews_count:860,  is_featured:false },
  { id:77, name:"Ankle Brace",             category:"Medical Devices",         brand:"Futuro",            description:"Stirrup ankle support for sprains and chronic ankle instability",                                            price:350,  original_price:420,  unit:"1 piece",         emoji:"🩺", requires_prescription:false, rating:4.5, reviews_count:620,  is_featured:false },
  { id:78, name:"Surgical Mask 50pcs",     category:"Medical Devices",         brand:"3M",                description:"3-layer disposable surgical masks with ear loops for infection protection",                                   price:380,  original_price:450,  unit:"50 pieces",       emoji:"😷", requires_prescription:false, rating:4.6, reviews_count:2100, is_featured:false },
  { id:79, name:"N95 Respirator Mask",     category:"Medical Devices",         brand:"3M",                description:"NIOSH-approved N95 particulate respirator for high-level protection",                                        price:450,  original_price:520,  unit:"5 pieces",        emoji:"😷", requires_prescription:false, rating:4.7, reviews_count:1580, is_featured:true  },
  { id:80, name:"Stethoscope",             category:"Medical Devices",         brand:"Littmann",          description:"Dual-head stethoscope for auscultating heart and lung sounds",                                              price:1250, original_price:1480, unit:"1 piece",         emoji:"🩺", requires_prescription:false, rating:4.8, reviews_count:740,  is_featured:false },
  // ── First Aid ─────────────────────────────────────────────────────────
  { id:81, name:"Crepe Bandage 4\"",       category:"First Aid",               brand:"Generic",           description:"Conforming crepe bandage for strains, sprains and compression support",                                      price:85,   original_price:null, unit:"1 roll",          emoji:"🩹", requires_prescription:false, rating:4.5, reviews_count:860,  is_featured:false },
  { id:82, name:"Adhesive Bandages 50pcs", category:"First Aid",               brand:"Band-Aid",          description:"Flexible fabric adhesive plasters for minor cuts and abrasions",                                             price:180,  original_price:210,  unit:"50 pieces",       emoji:"🩹", requires_prescription:false, rating:4.7, reviews_count:1560, is_featured:true  },
  { id:83, name:"Cotton Wool 100g",        category:"First Aid",               brand:"Generic",           description:"Medical-grade sterile cotton wool for wound cleaning and dressing",                                          price:95,   original_price:null, unit:"100 g roll",      emoji:"🩹", requires_prescription:false, rating:4.5, reviews_count:720,  is_featured:false },
  { id:84, name:"Dettol Antiseptic 100ml", category:"First Aid",               brand:"Dettol",            description:"Multipurpose antiseptic disinfectant for wound cleaning and surface hygiene",                                price:220,  original_price:260,  unit:"100 ml",          emoji:"🩹", requires_prescription:false, rating:4.7, reviews_count:1920, is_featured:true  },
  { id:85, name:"Betadine Solution 30ml",  category:"First Aid",               brand:"Cipla",             description:"Povidone-iodine antiseptic for pre-operative skin prep and wound care",                                      price:160,  original_price:190,  unit:"30 ml",           emoji:"🩹", requires_prescription:false, rating:4.6, reviews_count:1240, is_featured:false },
  { id:86, name:"Complete First Aid Kit",  category:"First Aid",               brand:"Generic",           description:"Comprehensive 42-piece first aid kit for home, office and travel use",                                       price:850,  original_price:1000, unit:"1 kit",           emoji:"🩹", requires_prescription:false, rating:4.7, reviews_count:680,  is_featured:true  },
  { id:87, name:"Sterile Gauze Pads",      category:"First Aid",               brand:"Generic",           description:"Non-woven sterile gauze pads for wound dressing and absorption",                                             price:120,  original_price:null, unit:"10 pieces",       emoji:"🩹", requires_prescription:false, rating:4.5, reviews_count:580,  is_featured:false },
  { id:88, name:"Medical Adhesive Tape",   category:"First Aid",               brand:"3M",                description:"Hypoallergenic paper tape for securing dressings to sensitive skin",                                         price:75,   original_price:90,   unit:"1 roll",          emoji:"🩹", requires_prescription:false, rating:4.5, reviews_count:640,  is_featured:false },
  { id:89, name:"Hydrogen Peroxide 3%",    category:"First Aid",               brand:"Generic",           description:"Antiseptic solution for wound cleaning and surface disinfection",                                            price:110,  original_price:null, unit:"100 ml",          emoji:"🩹", requires_prescription:false, rating:4.3, reviews_count:480,  is_featured:false },
  { id:90, name:"Burn Relief Gel 50g",     category:"First Aid",               brand:"Burnshield",        description:"Cooling hydrogel for minor burns, scalds and sunburn treatment",                                             price:195,  original_price:230,  unit:"50 g tube",       emoji:"🩹", requires_prescription:false, rating:4.6, reviews_count:520,  is_featured:false },
  { id:91, name:"Elastic Bandage 6\"",     category:"First Aid",               brand:"Generic",           description:"Wide elastic bandage for ankle, knee and wrist compression support",                                        price:140,  original_price:null, unit:"1 roll",          emoji:"🩹", requires_prescription:false, rating:4.4, reviews_count:460,  is_featured:false },
  { id:92, name:"Antiseptic Wound Spray",  category:"First Aid",               brand:"Dettol",            description:"Ready-to-use antiseptic spray for touchless wound cleaning",                                                price:260,  original_price:300,  unit:"75 ml",           emoji:"🩹", requires_prescription:false, rating:4.6, reviews_count:680,  is_featured:false },
  // ── Personal Care ─────────────────────────────────────────────────────
  { id:93, name:"Sunscreen SPF 50",        category:"Personal Care",           brand:"Neutrogena",        description:"Broad-spectrum UVA/UVB protection for daily sun defence",                                                    price:380,  original_price:450,  unit:"75 ml",           emoji:"🧴", requires_prescription:false, rating:4.7, reviews_count:1480, is_featured:true  },
  { id:94, name:"Hand Sanitizer Gel",      category:"Personal Care",           brand:"Dettol",            description:"70% alcohol instant hand sanitizer gel for on-the-go hygiene",                                              price:120,  original_price:150,  unit:"100 ml",          emoji:"🧴", requires_prescription:false, rating:4.6, reviews_count:2100, is_featured:true  },
  { id:95, name:"Pain Relief Balm 50g",    category:"Personal Care",           brand:"Tiger Balm",        description:"Herbal balm with camphor and menthol for muscle and joint pain",                                             price:180,  original_price:210,  unit:"50 g",            emoji:"🧴", requires_prescription:false, rating:4.7, reviews_count:1680, is_featured:true  },
  { id:96, name:"Lubricating Eye Drops",   category:"Personal Care",           brand:"Refresh",           description:"Carboxymethylcellulose eye drops for dry eye relief and lubrication",                                        price:195,  original_price:230,  unit:"10 ml",           emoji:"👁️", requires_prescription:false, rating:4.6, reviews_count:980,  is_featured:false },
  { id:97, name:"Nasal Saline Spray",      category:"Personal Care",           brand:"Otrivin",           description:"Isotonic saline nasal spray for congestion relief and nasal hygiene",                                       price:220,  original_price:260,  unit:"100 ml",          emoji:"🧴", requires_prescription:false, rating:4.5, reviews_count:840,  is_featured:false },
  { id:98, name:"Throat Lozenges",         category:"Personal Care",           brand:"Strepsils",         description:"Antiseptic honey-lemon lozenges for sore throat and mouth irritation",                                      price:120,  original_price:null, unit:"16 pieces",       emoji:"🍋", requires_prescription:false, rating:4.6, reviews_count:1240, is_featured:false },
  { id:99, name:"Anti-fungal Powder",      category:"Personal Care",           brand:"Canesten",          description:"Clotrimazole powder for athlete's foot and fungal skin infections",                                          price:180,  original_price:210,  unit:"75 g",            emoji:"🧴", requires_prescription:false, rating:4.5, reviews_count:680,  is_featured:false },
  { id:100,name:"Acne Treatment Gel",      category:"Personal Care",           brand:"Differin",          description:"Adapalene gel for treating and preventing acne breakouts",                                                   price:250,  original_price:290,  unit:"30 g",            emoji:"🧴", requires_prescription:true,  rating:4.6, reviews_count:820,  is_featured:false },
  { id:101,name:"Feminine Intimate Wash",  category:"Personal Care",           brand:"Lactacyd",          description:"pH-balanced feminine wash for daily intimate hygiene and comfort",                                           price:280,  original_price:330,  unit:"150 ml",          emoji:"🧴", requires_prescription:false, rating:4.7, reviews_count:1120, is_featured:false },
  { id:102,name:"Moisturising Body Cream", category:"Personal Care",           brand:"Cetaphil",          description:"Fragrance-free daily moisturiser for dry and sensitive skin",                                               price:320,  original_price:380,  unit:"100 g",           emoji:"🧴", requires_prescription:false, rating:4.7, reviews_count:1380, is_featured:false },
  // ── Dental Care ───────────────────────────────────────────────────────
  { id:103,name:"Sensodyne Toothpaste",    category:"Dental Care",             brand:"Sensodyne",         description:"Clinically proven toothpaste for sensitive teeth and lasting protection",                                    price:290,  original_price:340,  unit:"100 g",           emoji:"🦷", requires_prescription:false, rating:4.8, reviews_count:2200, is_featured:true  },
  { id:104,name:"Listerine Mouthwash",     category:"Dental Care",             brand:"Johnson & Johnson", description:"Antiseptic mouthwash killing 99.9% of germs for fresh breath and gum health",                               price:350,  original_price:420,  unit:"500 ml",          emoji:"🦷", requires_prescription:false, rating:4.7, reviews_count:1860, is_featured:true  },
  { id:105,name:"Dental Floss 50m",        category:"Dental Care",             brand:"Oral-B",            description:"Waxed dental floss for effective plaque removal between teeth",                                              price:120,  original_price:null, unit:"50 m",            emoji:"🦷", requires_prescription:false, rating:4.6, reviews_count:980,  is_featured:false },
  { id:106,name:"Teeth Whitening Strips",  category:"Dental Care",             brand:"Crest",             description:"14-day professional whitening strips for visibly whiter teeth",                                              price:580,  original_price:680,  unit:"14 pairs",        emoji:"🦷", requires_prescription:false, rating:4.5, reviews_count:760,  is_featured:false },
  { id:107,name:"Gum Care Toothpaste",     category:"Dental Care",             brand:"Colgate",           description:"Clinically proven formula reducing gum problems and strengthening enamel",                                   price:220,  original_price:260,  unit:"150 g",           emoji:"🦷", requires_prescription:false, rating:4.7, reviews_count:1480, is_featured:false },
  { id:108,name:"Tongue Cleaner Set",      category:"Dental Care",             brand:"Generic",           description:"Stainless steel tongue scrapers for bacteria removal and fresh breath",                                      price:80,   original_price:null, unit:"2 pieces",        emoji:"🦷", requires_prescription:false, rating:4.5, reviews_count:640,  is_featured:false },
  { id:109,name:"Orthodontic Wax",         category:"Dental Care",             brand:"Generic",           description:"Dental wax for covering sharp braces and preventing mouth irritation",                                       price:150,  original_price:null, unit:"5 strips",        emoji:"🦷", requires_prescription:false, rating:4.4, reviews_count:420,  is_featured:false },
  { id:110,name:"Kids Strawberry Toothpaste",category:"Dental Care",           brand:"Colgate",           description:"Fluoride toothpaste with fun strawberry flavour for children 2–6 years",                                   price:180,  original_price:210,  unit:"80 g",            emoji:"🦷", requires_prescription:false, rating:4.8, reviews_count:1680, is_featured:true  },
  // ── Nutrition ─────────────────────────────────────────────────────────
  { id:111,name:"Ensure Nutrition Powder", category:"Nutrition",               brand:"Abbott",            description:"Complete balanced nutrition shake for adults needing dietary supplementation",                                price:790,  original_price:920,  unit:"400 g",           emoji:"💪", requires_prescription:false, rating:4.8, reviews_count:1940, is_featured:true  },
  { id:112,name:"Horlicks Original 500g",  category:"Nutrition",               brand:"GSK",               description:"Malted milk drink with 23 vital nutrients for health and vitality",                                          price:450,  original_price:520,  unit:"500 g",           emoji:"💪", requires_prescription:false, rating:4.7, reviews_count:2340, is_featured:true  },
  { id:113,name:"Milo Chocolate Malt",     category:"Nutrition",               brand:"Nestle",            description:"Cocoa and malt energy drink rich in iron, calcium and vitamins",                                             price:380,  original_price:440,  unit:"400 g",           emoji:"💪", requires_prescription:false, rating:4.7, reviews_count:2100, is_featured:false },
  { id:114,name:"Complan Chocolate 500g",  category:"Nutrition",               brand:"Heinz",             description:"Energy drink with 34 vital nutrients for growth and development",                                             price:420,  original_price:490,  unit:"500 g",           emoji:"💪", requires_prescription:false, rating:4.6, reviews_count:1680, is_featured:false },
  { id:115,name:"Whey Protein Chocolate",  category:"Nutrition",               brand:"Optimum Nutrition", description:"Fast-absorbing whey protein isolate for post-workout muscle recovery",                                       price:890,  original_price:1050, unit:"500 g",           emoji:"💪", requires_prescription:false, rating:4.7, reviews_count:1240, is_featured:false },
  { id:116,name:"Electrolyte Powder",      category:"Nutrition",               brand:"Pocari Sweat",      description:"Ionic drink powder replenishing minerals lost through sweat and exercise",                                   price:280,  original_price:330,  unit:"10 sachets",      emoji:"💪", requires_prescription:false, rating:4.6, reviews_count:980,  is_featured:false },
  { id:117,name:"BCAA Supplement 200g",    category:"Nutrition",               brand:"MuscleBlaze",       description:"Branched-chain amino acids for muscle synthesis and exercise recovery",                                      price:780,  original_price:920,  unit:"200 g",           emoji:"💪", requires_prescription:false, rating:4.6, reviews_count:680,  is_featured:false },
  { id:118,name:"Collagen Peptides Powder",category:"Nutrition",               brand:"Vital Proteins",    description:"Hydrolysed marine collagen for skin elasticity, joints and hair health",                                    price:690,  original_price:820,  unit:"200 g",           emoji:"💪", requires_prescription:false, rating:4.7, reviews_count:920,  is_featured:false },
  { id:119,name:"Apple Cider Vinegar",     category:"Nutrition",               brand:"Bragg",             description:"Raw unfiltered apple cider vinegar with mother for metabolism support",                                      price:380,  original_price:440,  unit:"500 ml",          emoji:"🍎", requires_prescription:false, rating:4.5, reviews_count:1560, is_featured:false },
  { id:120,name:"Green Tea Extract 60",    category:"Nutrition",               brand:"GNC",               description:"High-potency EGCG green tea extract for metabolism and antioxidant support",                                price:450,  original_price:530,  unit:"60 capsules",     emoji:"🍵", requires_prescription:false, rating:4.6, reviews_count:840,  is_featured:false },
];

const CAT_ICONS = {
  All: "🛍️",
  Medicines: "💊",
  "Vitamins & Supplements": "🌿",
  "Baby Care": "👶",
  "Medical Devices": "🩺",
  "First Aid": "🩹",
  "Personal Care": "🧴",
  "Dental Care": "🦷",
  Nutrition: "💪",
};

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "rating", label: "Top Rated" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
];

function StarRating({ rating }) {
  return (
    <span className="med-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= Math.round(rating) ? "ms-full" : "ms-empty"}>★</span>
      ))}
      <span className="med-rating-num">{rating.toFixed(1)}</span>
    </span>
  );
}

function ProductCard({ product: p, cartQty, onAdd, onRemove, user, onAuth }) {
  const discount = p.original_price
    ? Math.round((1 - p.price / p.original_price) * 100)
    : 0;

  return (
    <div className="med-card">
      {discount > 0 && <span className="med-discount-badge">-{discount}%</span>}
      {p.requires_prescription && <span className="med-rx-badge">Rx</span>}

      <div className="med-card-emoji">{p.emoji}</div>

      <div className="med-card-body">
        <p className="med-brand">{p.brand}</p>
        <h3 className="med-name">{p.name}</h3>
        <p className="med-unit">{p.unit}</p>
        <p className="med-desc">{p.description}</p>
        <StarRating rating={Number(p.rating)} />
        <p className="med-reviews">({p.reviews_count.toLocaleString()} reviews)</p>

        <div className="med-price-row">
          <span className="med-price">৳{Number(p.price).toFixed(0)}</span>
          {p.original_price && (
            <span className="med-original-price">৳{Number(p.original_price).toFixed(0)}</span>
          )}
        </div>
      </div>

      <div className="med-card-footer">
        {!user ? (
          <button className="med-btn-login" onClick={onAuth}>
            🔒 Login to Buy
          </button>
        ) : cartQty > 0 ? (
          <div className="med-qty-row">
            <button className="med-qty-btn" onClick={() => onRemove(p.id)}>−</button>
            <span className="med-qty-num">{cartQty}</span>
            <button className="med-qty-btn" onClick={() => onAdd(p.id)}>+</button>
          </div>
        ) : (
          <button className="med-btn-add" onClick={() => onAdd(p.id)}>
            + Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}

function CartPanel({ cart, products, onClose, onCheckout, onQtyChange }) {
  const cartItems = Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ product: products.find((p) => p.id === Number(id)), qty }))
    .filter((x) => x.product);

  const total = cartItems.reduce((sum, { product: p, qty }) => sum + Number(p.price) * qty, 0);

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="cart-panel" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h2>🛒 Your Cart</h2>
          <button className="cart-close" onClick={onClose}>✕</button>
        </div>

        {cartItems.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-icon">🛒</div>
            <p>Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cartItems.map(({ product: p, qty }) => (
                <div className="cart-item" key={p.id}>
                  <span className="ci-emoji">{p.emoji}</span>
                  <div className="ci-info">
                    <p className="ci-name">{p.name}</p>
                    <p className="ci-unit">{p.unit}</p>
                  </div>
                  <div className="ci-right">
                    <div className="ci-qty-row">
                      <button onClick={() => onQtyChange(p.id, qty - 1)}>−</button>
                      <span>{qty}</span>
                      <button onClick={() => onQtyChange(p.id, qty + 1)}>+</button>
                    </div>
                    <p className="ci-price">৳{(Number(p.price) * qty).toFixed(0)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              <div className="cart-total-row">
                <span>Subtotal ({cartItems.reduce((s, x) => s + x.qty, 0)} items)</span>
                <strong>৳{total.toFixed(0)}</strong>
              </div>
              <p className="cart-delivery-note">🚚 Free delivery on orders above ৳500</p>
              <button className="cart-checkout-btn" onClick={onCheckout}>
                Proceed to Checkout →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CheckoutModal({ cart, products, user, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: "",
    city: "Dhaka",
    payment: "COD",
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const cartItems = Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ product: products.find((p) => p.id === Number(id)), qty }))
    .filter((x) => x.product);

  const total = cartItems.reduce((sum, { product: p, qty }) => sum + Number(p.price) * qty, 0);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!form.address.trim()) return setErr("Please enter your delivery address.");
    setLoading(true);
    setErr("");
    try {
      const items = cartItems.map(({ product: p, qty }) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        qty,
      }));
      const order = await api.placeMedicineOrder({
        items,
        total,
        address: `${form.name}, ${form.phone}, ${form.address}, ${form.city}`,
        phone: form.phone,
        payment_method: form.payment,
      });
      onSuccess(order.order);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setLoading(false);
    }
  }

  const PAYMENT_OPTS = [
    { value: "COD", label: "💵 Cash on Delivery" },
    { value: "bKash", label: "📱 bKash" },
    { value: "Nagad", label: "📱 Nagad" },
    { value: "Rocket", label: "📱 Rocket" },
  ];

  return (
    <div className="co-backdrop" onClick={onClose}>
      <div className="co-card" onClick={(e) => e.stopPropagation()}>
        <div className="co-header">
          <h2>Checkout</h2>
          <button className="co-close" onClick={onClose}>✕</button>
        </div>

        <form className="co-form" onSubmit={submit}>
          <p className="co-section-title">Delivery Details</p>

          <div className="co-row">
            <div className="co-col">
              <label>Full Name</label>
              <input value={form.name} onChange={set("name")} required placeholder="Your name" />
            </div>
            <div className="co-col">
              <label>Phone</label>
              <input value={form.phone} onChange={set("phone")} required placeholder="01XXXXXXXXX" />
            </div>
          </div>

          <label>Delivery Address</label>
          <textarea
            value={form.address}
            onChange={set("address")}
            required
            rows={3}
            placeholder="House/Flat No., Road, Area…"
          />

          <label>City</label>
          <select value={form.city} onChange={set("city")}>
            {["Dhaka", "Chittagong", "Rajshahi", "Sylhet", "Khulna", "Mymensingh", "Barishal"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <p className="co-section-title">Payment Method</p>
          <div className="co-payment-grid">
            {PAYMENT_OPTS.map((o) => (
              <label key={o.value} className={`co-pay-opt ${form.payment === o.value ? "active" : ""}`}>
                <input
                  type="radio"
                  name="payment"
                  value={o.value}
                  checked={form.payment === o.value}
                  onChange={set("payment")}
                />
                {o.label}
              </label>
            ))}
          </div>

          <div className="co-summary">
            <div className="co-summary-row">
              <span>{cartItems.reduce((s, x) => s + x.qty, 0)} items</span>
              <span>৳{total.toFixed(0)}</span>
            </div>
            <div className="co-summary-row">
              <span>Delivery</span>
              <span className={total >= 500 ? "co-free" : ""}>
                {total >= 500 ? "FREE" : "৳50"}
              </span>
            </div>
            <div className="co-summary-total">
              <strong>Total</strong>
              <strong>৳{(total >= 500 ? total : total + 50).toFixed(0)}</strong>
            </div>
          </div>

          {err && <p className="co-err">{err}</p>}

          <button className="co-submit-btn" type="submit" disabled={loading}>
            {loading ? "Placing order…" : "Place Order →"}
          </button>
        </form>
      </div>
    </div>
  );
}

function OrderSuccessModal({ order, onClose }) {
  const orderId = `ORD-${String(order.id).padStart(6, "0")}`;
  const items = order.items || [];
  const count = items.reduce((s, x) => s + x.qty, 0);

  return (
    <div className="os-backdrop" onClick={onClose}>
      <div className="os-card" onClick={(e) => e.stopPropagation()}>
        <div className="os-icon">✅</div>
        <h2 className="os-title">Order Placed!</h2>
        <p className="os-ref">Order ID: <strong>{orderId}</strong></p>
        <div className="os-info">
          <div className="os-row"><span>Items</span><span>{count}</span></div>
          <div className="os-row"><span>Total</span><span>৳{Number(order.total).toFixed(0)}</span></div>
          <div className="os-row"><span>Payment</span><span>{order.payment_method}</span></div>
          <div className="os-row"><span>Delivery</span><span>2–3 business days</span></div>
        </div>
        <p className="os-note">
          {order.payment_method === "COD"
            ? "💵 Pay in cash when your order arrives."
            : `📱 Pay via ${order.payment_method} to 01XXXXXXXXX after confirmation.`}
        </p>
        <button className="os-btn" onClick={onClose}>Continue Shopping</button>
      </div>
    </div>
  );
}

function MyOrders({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.myMedicineOrders()
      .then((d) => setOrders(d.orders))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="med-loading">Loading orders…</p>;
  if (!orders.length)
    return (
      <div className="med-empty">
        <div style={{ fontSize: "3rem" }}>📦</div>
        <p>You haven't placed any orders yet.</p>
      </div>
    );

  return (
    <div className="mo-list">
      {orders.map((o) => {
        const orderId = `ORD-${String(o.id).padStart(6, "0")}`;
        const items = o.items || [];
        const count = items.reduce((s, x) => s + x.qty, 0);
        return (
          <div className="mo-row" key={o.id}>
            <div className="mo-left">
              <p className="mo-ref">{orderId}</p>
              <p className="mo-items">{count} item{count !== 1 ? "s" : ""} · ৳{Number(o.total).toFixed(0)}</p>
              <p className="mo-addr">{o.address}</p>
            </div>
            <div className="mo-right">
              <span className={`mo-status ${o.status}`}>{o.status}</span>
              <p className="mo-pay">{o.payment_method}</p>
              <p className="mo-date">{new Date(o.created_at).toLocaleDateString("en-GB")}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Medicines({ user, onBack, onAuth }) {
  const [products] = useState(ALL_PRODUCTS);
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const [tab, setTab] = useState("shop");

  const filtered = useMemo(() => {
    let list = products;
    if (category !== "All") list = list.filter((p) => p.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }
    const sortFns = {
      featured:   (a, b) => (b.is_featured - a.is_featured) || b.rating - a.rating,
      rating:     (a, b) => b.rating - a.rating,
      price_asc:  (a, b) => a.price - b.price,
      price_desc: (a, b) => b.price - a.price,
      newest:     (a, b) => b.id - a.id,
    };
    return [...list].sort(sortFns[sort] || sortFns.featured);
  }, [products, category, search, sort]);

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  function addToCart(id) {
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  }
  function removeFromCart(id) {
    setCart((c) => {
      const next = { ...c, [id]: (c[id] || 1) - 1 };
      if (next[id] <= 0) delete next[id];
      return next;
    });
  }
  function setQty(id, qty) {
    if (qty <= 0) {
      setCart((c) => { const n = { ...c }; delete n[id]; return n; });
    } else {
      setCart((c) => ({ ...c, [id]: qty }));
    }
  }

  function handleCheckout() {
    setCartOpen(false);
    setCheckoutOpen(true);
  }

  function handleOrderSuccess(order) {
    setCheckoutOpen(false);
    setCart({});
    setSuccessOrder(order);
  }

  return (
    <div className="med-page">
      {/* NAV */}
      <header className="med-nav">
        <button className="med-back-btn" onClick={onBack}>← Back</button>
        <div className="med-brand">
          💊 <span>SaveLife</span>
          <span className="med-brand-sep">·</span>
          <span className="med-brand-sub">Pharmacy</span>
        </div>
        <div style={{ flex: 1 }} />
        <ThemeToggle />
        <button
          className="med-cart-btn"
          onClick={() => { if (!user) { onAuth(); } else { setCartOpen(true); } }}
        >
          🛒
          {cartCount > 0 && <span className="med-cart-badge">{cartCount}</span>}
        </button>
      </header>

      {/* TAB BAR */}
      {user && (
        <div className="med-tab-bar">
          <button
            className={`med-tab ${tab === "shop" ? "active" : ""}`}
            onClick={() => setTab("shop")}
          >
            🛍️ Shop
          </button>
          <button
            className={`med-tab ${tab === "orders" ? "active" : ""}`}
            onClick={() => setTab("orders")}
          >
            📦 My Orders
          </button>
        </div>
      )}

      {tab === "orders" && user ? (
        <div className="med-orders-section">
          <h2 className="med-orders-title">My Orders</h2>
          <MyOrders user={user} />
        </div>
      ) : (
        <>
          {/* HERO BANNER */}
          <div className="med-hero">
            <div className="med-hero-inner">
              <span className="med-hero-tag">🏥 SaveLife Pharmacy</span>
              <h1>Medicines & Health Products</h1>
              <p>120+ products · Genuine brands · Delivered to your door</p>
              <div className="med-hero-pills">
                <span>💊 Medicines</span>
                <span>🌿 Vitamins</span>
                <span>👶 Baby Care</span>
                <span>🩺 Devices</span>
                <span>🦷 Dental</span>
              </div>
            </div>
          </div>

          {/* CATEGORY BAR */}
          <div className="med-cat-bar">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                className={`med-cat-btn ${category === c ? "active" : ""}`}
                onClick={() => setCategory(c)}
              >
                {CAT_ICONS[c]} {c}
              </button>
            ))}
          </div>

          {/* SEARCH + SORT */}
          <div className="med-toolbar">
            <input
              className="med-search"
              placeholder="Search medicines, brands…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="med-sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {(search || category !== "All") && (
              <button
                className="med-clear-btn"
                onClick={() => { setSearch(""); setCategory("All"); }}
              >
                Clear
              </button>
            )}
            <span className="med-count">{filtered.length} products</span>
          </div>

          {/* PRODUCT GRID */}
          <div className="med-grid-section">
            {filtered.length === 0 ? (
              <div className="med-empty">
                <div style={{ fontSize: "3rem" }}>🔍</div>
                <p>No products found. Try a different search.</p>
              </div>
            ) : (
              <div className="med-grid">
                {filtered.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    cartQty={cart[p.id] || 0}
                    onAdd={addToCart}
                    onRemove={removeFromCart}
                    user={user}
                    onAuth={onAuth}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* CART PANEL */}
      {cartOpen && (
        <CartPanel
          cart={cart}
          products={products}
          onClose={() => setCartOpen(false)}
          onCheckout={handleCheckout}
          onQtyChange={setQty}
        />
      )}

      {/* CHECKOUT */}
      {checkoutOpen && (
        <CheckoutModal
          cart={cart}
          products={products}
          user={user}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={handleOrderSuccess}
        />
      )}

      {/* SUCCESS */}
      {successOrder && (
        <OrderSuccessModal
          order={successOrder}
          onClose={() => setSuccessOrder(null)}
        />
      )}
    </div>
  );
}
