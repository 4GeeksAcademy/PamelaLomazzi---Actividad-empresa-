(function () {
	"use strict";

	const STORAGE_KEY = "hcLang";
	const SUPPORTED = ["es", "en"];

	const dictionaries = {
		es: {
			"aria.navMain": "Navegacion principal",
			"aria.navApply": "Navegacion de aplicacion",
			"aria.homeLink": "HealthCore Inicio",
			"aria.backHome": "Volver al inicio de HealthCore",
			"aria.logoAlt": "Logo HealthCore",
			"aria.openMenu": "Abrir menu",
			"aria.videoAlt": "Servicio de videoconsultas de HealthCore",
			"nav.home": "Inicio",
			"nav.services": "Servicios",
			"nav.about": "Nosotros",
			"nav.contact": "Contacto",
			"nav.cta": "Aplicar",
			"hero.badge": "HealthCore | Texas, Florida, Georgia y Reino Unido",
			"hero.title": "Atencion Medica Accesible y de Alta Calidad",
			"hero.text": "Desde 2011 brindamos atencion ambulatoria con citas el mismo dia, procesos agiles y personal bilingue para una experiencia mas humana y eficiente.",
			"hero.viewServices": "Ver Servicios",
			"services.title": "Servicios y Beneficios",
			"services.text": "Un enfoque ambulatorio integral para pacientes, familias y empresas que necesitan atencion confiable con estandares internacionales.",
			"services.red.title": "Red Global",
			"services.red.p1": "12 clinicas en TX, FL, GA y UK para coordinar continuidad de cuidado en varios mercados.",
			"services.red.p2": "Nuestra red comparte historiales clinicos seguros, protocolos estandarizados y equipos locales para garantizar la misma calidad en cada sede.",
			"services.red.li1": "Austin, Dallas, Miami, Orlando y Atlanta con cobertura ambulatoria extendida.",
			"services.red.li2": "Coordinacion internacional para pacientes que viajan entre USA y UK.",
			"services.access.title": "Accesibilidad",
			"services.access.p1": "Horarios extendidos, sin esperas innecesarias y procesos administrativos simplificados.",
			"services.access.p2": "Priorizamos acceso rapido con agendamiento digital y soporte humano para cada paciente, incluyendo personal bilingue y seguimiento postconsulta.",
			"services.access.li1": "Citas el mismo dia segun disponibilidad de sede.",
			"services.access.li2": "Canales web y telefonicos para pacientes de distintas edades.",
			"services.special.title": "Cuidado Especializado",
			"services.special.p1": "Atencion primaria, manejo de enfermedades cronicas y seguimiento preventivo centrado en resultados.",
			"services.special.p2": "Diseñamos planes de cuidado personalizados para diabetes, hipertension y salud cardiovascular, conectando especialistas cuando el caso lo requiere.",
			"services.special.li1": "Evaluaciones preventivas anuales y control de factores de riesgo.",
			"services.special.li2": "Equipos multidisciplinarios para continuidad clinica.",
			"video.badge": "Nuevo servicio digital",
			"video.title": "ahora tambien contamos con videoconsultas",
			"video.text": "Agenda consultas virtuales con profesionales de la red HealthCore para seguimiento, orientacion y control de patologias cronicas sin desplazarte.",
			"gallery.badge": "Nuestras instalaciones",
			"gallery.title": "Conoce HealthCore por dentro",
			"gallery.prev": "Imagen anterior",
			"gallery.next": "Imagen siguiente",
			"about.title": "Nuestra Historia",
			"about.text": "HealthCore nacio en Austin en 2011 con la mision de elevar la calidad de la atencion ambulatoria. En mas de una decada, evolucionamos hacia una red internacional que combina excelencia clinica, eficiencia operativa y cercania humana.",
			"about.commitment": "Compromiso HealthCore",
			"about.commitmentText": "Atender mejor, mas rapido y con empatía en cada consulta.",
			"contact.title": "Contactanos",
			"contact.text": "Nuestro equipo de atencion ambulatoria esta disponible para ayudarte a agendar, resolver dudas de cobertura y orientarte segun tu motivo de consulta.",
			"contact.phoneTitle": "Telefono y WhatsApp",
			"contact.emailTitle": "Correo y Portal Paciente",
			"contact.locationTitle": "Sedes y Horarios",
			"contact.phone": "Telefono",
			"contact.phoneDesc": "Respuesta en minutos durante horario clinico.",
			"contact.email": "Correo",
			"contact.emailDesc": "Consultas generales, documentos y seguimiento.",
			"contact.locationAustin": "Austin HQ: 2100 Medical Parkway, Austin, TX.",
			"contact.locationLondon": "London Office: 18 Upper Wimpole Street, London, UK.",
			"contact.hoursInline": "Lun-Sab: 7:00 a 21:00 | Dom: 8:00 a 15:00",
			"contact.formText": "Si prefieres otro canal, podemos ayudarte por telefono, WhatsApp o correo. Nuestro equipo te dara una respuesta rapida y personalizada para resolver tus dudas y coordinar tu consulta.",
			"contact.schedule": "Horario de atencion",
			"contact.scheduleWeek": "Lun-Sab: 7:00 a 21:00",
			"contact.scheduleSun": "Dom: 8:00 a 15:00",
			"footer.text": "© 2026 HealthCore. Todos los derechos reservados. Si presentas una emergencia vital, llama al 911 o al servicio local de emergencias.",
			"footer.applyText": "HealthCore | Atencion ambulatoria profesional en USA y UK. Si presentas una emergencia vital, llama al 911 o al servicio local de emergencias.",
			"form.title": "Formulario de aplicacion",
			"form.subtitle": "Completa el formulario y nuestro equipos se pondra en contacto contigo para coordinar una consulta gratuita de 30 minutos. Evaluamos cada solicitud para asegurar que podemos ofrecer la mejor experiencia posible.",
			"form.contactData": "Datos de contacto",
			"form.required": "Todos los campos son obligatorios.",
			"form.fullName": "Nombre completo",
			"form.email": "Email",
			"form.phone": "Telefono",
			"form.city": "Ciudad",
			"form.reason": "Motivo de consulta",
			"form.reasonPlaceholder": "Selecciona una opcion",
			"form.reasonPrimary": "Atencion primaria",
			"form.reasonSpecialist": "Especialista",
			"form.reasonPreventive": "Preventiva",
			"form.reasonBilling": "Facturacion y gestion de ingreso",
			"form.reasonAccess": "Experiencia y acceso paciente",
			"form.reasonOther": "Otro motivo",
			"form.location": "Ubicacion",
			"form.locationPlaceholder": "Selecciona una opcion",
			"form.submit": "Enviar Solicitud"
		},
		en: {
			"aria.navMain": "Main navigation",
			"aria.navApply": "Application navigation",
			"aria.homeLink": "HealthCore Home",
			"aria.backHome": "Back to HealthCore home",
			"aria.logoAlt": "HealthCore logo",
			"aria.openMenu": "Open menu",
			"aria.videoAlt": "HealthCore video consultation service",
			"nav.home": "Home",
			"nav.services": "Services",
			"nav.about": "About",
			"nav.contact": "Contact",
			"nav.cta": "Apply",
			"hero.badge": "HealthCore | Texas, Florida, Georgia and United Kingdom",
			"hero.title": "Accessible, High-Quality Medical Care",
			"hero.text": "Since 2011, we have provided ambulatory care with same-day appointments, streamlined processes, and bilingual staff for a more human and efficient experience.",
			"hero.viewServices": "View Services",
			"services.title": "Services and Benefits",
			"services.text": "A comprehensive ambulatory approach for patients, families, and organizations that need reliable care with international standards.",
			"services.red.title": "Global Network",
			"services.red.p1": "12 clinics across TX, FL, GA, and the UK to coordinate continuity of care across multiple markets.",
			"services.red.p2": "Our network shares secure clinical records, standardized protocols, and local teams to guarantee consistent quality at every location.",
			"services.red.li1": "Austin, Dallas, Miami, Orlando, and Atlanta with expanded ambulatory coverage.",
			"services.red.li2": "International coordination for patients traveling between the USA and UK.",
			"services.access.title": "Accessibility",
			"services.access.p1": "Extended hours, no unnecessary waiting, and simplified administrative workflows.",
			"services.access.p2": "We prioritize fast access with digital scheduling and human support for every patient, including bilingual staff and post-visit follow-up.",
			"services.access.li1": "Same-day appointments depending on location availability.",
			"services.access.li2": "Web and phone channels for patients of different age groups.",
			"services.special.title": "Specialized Care",
			"services.special.p1": "Primary care, chronic disease management, and preventive follow-up focused on outcomes.",
			"services.special.p2": "We design personalized care plans for diabetes, hypertension, and cardiovascular health, connecting specialists when needed.",
			"services.special.li1": "Annual preventive evaluations and risk-factor control.",
			"services.special.li2": "Multidisciplinary teams for clinical continuity.",
			"video.badge": "New digital service",
			"video.title": "we now also offer video consultations",
			"video.text": "Book virtual consultations with HealthCore professionals for follow-up, guidance, and chronic condition management without traveling.",
			"gallery.badge": "Our facilities",
			"gallery.title": "Get to know HealthCore from the inside",
			"gallery.prev": "Previous image",
			"gallery.next": "Next image",
			"about.title": "Our Story",
			"about.text": "HealthCore was founded in Austin in 2011 with the mission of improving ambulatory care quality. Over more than a decade, we evolved into an international network combining clinical excellence, operational efficiency, and human care.",
			"about.commitment": "HealthCore Commitment",
			"about.commitmentText": "Better, faster, and more empathetic care in every consultation.",
			"contact.title": "Contact Us",
			"contact.text": "Our ambulatory care team is available to help you book appointments, resolve coverage questions, and guide you according to your consultation needs.",
			"contact.phoneTitle": "Phone and WhatsApp",
			"contact.emailTitle": "Email and Patient Portal",
			"contact.locationTitle": "Locations and Hours",
			"contact.phone": "Phone",
			"contact.phoneDesc": "Response in minutes during clinical hours.",
			"contact.email": "Email",
			"contact.emailDesc": "General inquiries, documents, and follow-up.",
			"contact.locationAustin": "Austin HQ: 2100 Medical Parkway, Austin, TX.",
			"contact.locationLondon": "London Office: 18 Upper Wimpole Street, London, UK.",
			"contact.hoursInline": "Mon-Sat: 7:00 AM to 9:00 PM | Sun: 8:00 AM to 3:00 PM",
			"contact.formText": "If you prefer another channel, we can help by phone, WhatsApp, or email. Our team will provide a quick and personalized response to answer your questions and coordinate your consultation.",
			"contact.schedule": "Hours",
			"contact.scheduleWeek": "Mon-Sat: 7:00 AM to 9:00 PM",
			"contact.scheduleSun": "Sun: 8:00 AM to 3:00 PM",
			"footer.text": "© 2026 HealthCore. All rights reserved. If you have a life-threatening emergency, call 911 or your local emergency service.",
			"footer.applyText": "HealthCore | Professional ambulatory care in the USA and UK. If you have a life-threatening emergency, call 911 or your local emergency service.",
			"form.title": "Application Form",
			"form.subtitle": "Complete the form and our team will contact you to schedule a free 30-minute consultation. We review every request to ensure the best possible experience.",
			"form.contactData": "Contact Information",
			"form.required": "All fields are required.",
			"form.fullName": "Full name",
			"form.email": "Email",
			"form.phone": "Phone",
			"form.city": "City",
			"form.reason": "Reason for consultation",
			"form.reasonPlaceholder": "Select an option",
			"form.reasonPrimary": "Primary care",
			"form.reasonSpecialist": "Specialist",
			"form.reasonPreventive": "Preventive",
			"form.reasonBilling": "Billing and revenue management",
			"form.reasonAccess": "Patient experience and access",
			"form.reasonOther": "Other reason",
			"form.location": "Location",
			"form.locationPlaceholder": "Select an option",
			"form.submit": "Submit Request"
		}
	};

	const seoByPage = {
		index: {
			es: {
				title: "HealthCore | Atencion Medica Accesible y de Alta Calidad",
				description: "HealthCore ofrece servicios de salud ambulatoria en Austin y red global de clinicas, con citas el mismo dia y personal bilingue.",
				locale: "es_ES"
			},
			en: {
				title: "HealthCore | Accessible, High-Quality Medical Care",
				description: "HealthCore provides ambulatory healthcare services in Austin and a global clinic network, with same-day appointments and bilingual staff.",
				locale: "en_US"
			}
		},
		apply: {
			es: {
				title: "Aplicar | HealthCore",
				description: "Formulario de aplicacion de HealthCore para consultas ambulatorias en USA y UK.",
				locale: "es_ES"
			},
			en: {
				title: "Apply | HealthCore",
				description: "HealthCore application form for ambulatory consultations in the USA and UK.",
				locale: "en_US"
			}
		}
	};

	function getPageName() {
		const path = window.location.pathname;
		return path.endsWith("apply.html") ? "apply" : "index";
	}

	function getLang() {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (SUPPORTED.includes(stored)) return stored;
		const htmlLang = document.documentElement.lang;
		return SUPPORTED.includes(htmlLang) ? htmlLang : "es";
	}

	function t(lang, key) {
		return (dictionaries[lang] && dictionaries[lang][key]) || (dictionaries.es && dictionaries.es[key]) || key;
	}

	function updateSeo(lang) {
		const page = getPageName();
		const seo = seoByPage[page] && seoByPage[page][lang];
		if (!seo) return;
		document.title = seo.title;
		const desc = document.querySelector('meta[name="description"]');
		if (desc) desc.setAttribute("content", seo.description);
		const ogLocale = document.querySelector('meta[property="og:locale"]');
		if (ogLocale) ogLocale.setAttribute("content", seo.locale);
	}

	function applyLang(lang) {
		const safeLang = SUPPORTED.includes(lang) ? lang : "es";
		localStorage.setItem(STORAGE_KEY, safeLang);
		document.documentElement.lang = safeLang;

		document.querySelectorAll("[data-i18n]").forEach(function (el) {
			const key = el.getAttribute("data-i18n");
			el.textContent = t(safeLang, key);
		});

		document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
			const attrMap = el.getAttribute("data-i18n-attr");
			if (!attrMap) return;
			attrMap.split(";").forEach(function (entry) {
				const pair = entry.split(":");
				if (pair.length !== 2) return;
				const attr = pair[0].trim();
				const key = pair[1].trim();
				if (!attr || !key) return;
				el.setAttribute(attr, t(safeLang, key));
			});
		});

		document.querySelectorAll("[data-lang-switch]").forEach(function (btn) {
			const isActive = btn.getAttribute("data-lang-switch") === safeLang;
			btn.setAttribute("aria-pressed", isActive ? "true" : "false");
			btn.classList.toggle("bg-teal-600", isActive);
			btn.classList.toggle("text-white", isActive);
		});

		updateSeo(safeLang);
		window.dispatchEvent(new CustomEvent("hc:langchange", { detail: { lang: safeLang } }));
	}

	document.querySelectorAll("[data-lang-switch]").forEach(function (btn) {
		btn.addEventListener("click", function () {
			applyLang(btn.getAttribute("data-lang-switch"));
		});
	});

	applyLang(getLang());
})();
