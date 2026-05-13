(function () {
	"use strict";
	window.__hcValidationBootstrapped = true;

	const form = document.getElementById("applyForm");
	const formStatus = document.getElementById("formStatus");
	if (!form) return;

	function currentLang() {
		return localStorage.getItem("hcLang") === "en" ? "en" : "es";
	}

	function msg(key) {
		const messages = {
			es: {
				fullNameRequired: "El nombre completo es obligatorio.",
				fullNameLength: "El nombre debe tener al menos 3 caracteres.",
				fullNameFormat: "El nombre solo puede contener letras, espacios, apostrofes y guiones.",
				emailRequired: "El email es obligatorio.",
				emailInvalid: "Ingresa un email valido (ejemplo: nombre@dominio.com).",
				phoneRequired: "El telefono es obligatorio.",
				phoneFormat: "El telefono solo puede contener numeros, espacios, parentesis, guiones y +.",
				phoneMin: "El telefono debe tener al menos 8 digitos.",
				phoneMax: "El telefono no puede superar 15 digitos.",
				cityRequired: "La ciudad es obligatoria.",
				cityLength: "La ciudad debe tener al menos 2 caracteres.",
				reasonRequired: "Selecciona un motivo de consulta.",
				reasonInvalid: "Selecciona una opcion valida en motivo de consulta.",
				locationRequired: "Selecciona una ubicacion.",
				locationInvalid: "Selecciona una ubicacion valida (USA o UK).",
				statusErrorPrefix: "Corrige los campos marcados antes de enviar: ",
				statusSuccess: "Solicitud enviada con exito. Te contactaremos en breve.",
				labelFullName: "Nombre completo",
				labelEmail: "Email",
				labelPhone: "Telefono",
				labelCity: "Ciudad",
				labelReason: "Motivo de consulta",
				labelLocation: "Ubicacion"
			},
			en: {
				fullNameRequired: "Full name is required.",
				fullNameLength: "Full name must be at least 3 characters.",
				fullNameFormat: "Name can only include letters, spaces, apostrophes and hyphens.",
				emailRequired: "Email is required.",
				emailInvalid: "Enter a valid email (example: name@domain.com).",
				phoneRequired: "Phone is required.",
				phoneFormat: "Phone can only include numbers, spaces, parentheses, hyphens and +.",
				phoneMin: "Phone must have at least 8 digits.",
				phoneMax: "Phone cannot exceed 15 digits.",
				cityRequired: "City is required.",
				cityLength: "City must be at least 2 characters.",
				reasonRequired: "Select a reason for consultation.",
				reasonInvalid: "Select a valid reason for consultation.",
				locationRequired: "Select a location.",
				locationInvalid: "Select a valid location (USA or UK).",
				statusErrorPrefix: "Please fix the highlighted fields before submitting: ",
				statusSuccess: "Request sent successfully. We will contact you shortly.",
				labelFullName: "Full name",
				labelEmail: "Email",
				labelPhone: "Phone",
				labelCity: "City",
				labelReason: "Reason for consultation",
				labelLocation: "Location"
			}
		};

		const lang = currentLang();
		return (messages[lang] && messages[lang][key]) || messages.es[key] || key;
	}

	const fields = {
		fullName: {
			validate: (value) => {
				const clean = value.trim();
				if (!clean) return msg("fullNameRequired");
				if (clean.length < 3) return msg("fullNameLength");
				if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'\-\s]+$/.test(clean)) {
					return msg("fullNameFormat");
				}
				return "";
			}
		},
		email: {
			validate: (value) => {
				const clean = value.trim();
				if (!clean) return msg("emailRequired");
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
				if (!emailRegex.test(clean)) return msg("emailInvalid");
				return "";
			}
		},
		phone: {
			validate: (value) => {
				const clean = value.trim();
				if (!clean) return msg("phoneRequired");
				if (!/^\+?[0-9\s()\-]+$/.test(clean)) {
					return msg("phoneFormat");
				}
				const digits = clean.replace(/\D/g, "");
				if (digits.length < 8) return msg("phoneMin");
				if (digits.length > 15) return msg("phoneMax");
				return "";
			}
		},
		city: {
			validate: (value) => {
				const clean = value.trim();
				if (!clean) return msg("cityRequired");
				if (clean.length < 2) return msg("cityLength");
				return "";
			}
		},
		consultReason: {
			validate: (value) => {
				if (!value) return msg("reasonRequired");
				const validReasons = [
					"primaria",
					"especialista",
					"preventiva",
					"facturacion-ingreso",
					"acceso-paciente",
					"otro-motivo"
				];
				return validReasons.includes(value) ? "" : msg("reasonInvalid");
			}
		},
		location: {
			validate: (value) => {
				if (!value) return msg("locationRequired");
				const validLocations = ["usa", "uk"];
				return validLocations.includes(value) ? "" : msg("locationInvalid");
			}
		}
	};

	function fieldLabel(name) {
		const labels = {
			fullName: msg("labelFullName"),
			email: msg("labelEmail"),
			phone: msg("labelPhone"),
			city: msg("labelCity"),
			consultReason: msg("labelReason"),
			location: msg("labelLocation")
		};
		return labels[name] || name;
	}

	function getField(name) {
		return form.elements.namedItem(name);
	}

	function getErrorEl(name) {
		return document.getElementById(name + "Error");
	}

	function setError(name, message) {
		const input = getField(name);
		const errorEl = getErrorEl(name);
		if (!input || !errorEl) return;

		errorEl.textContent = message;
		input.setAttribute("aria-invalid", message ? "true" : "false");

		if (message) {
			input.classList.add("border-red-500", "focus:border-red-500", "focus:ring-red-200");
			input.classList.remove("border-slate-300", "focus:border-teal-500", "focus:ring-teal-200");
		} else {
			input.classList.remove("border-red-500", "focus:border-red-500", "focus:ring-red-200");
			input.classList.add("border-slate-300", "focus:border-teal-500", "focus:ring-teal-200");
		}
	}

	function validateOne(name) {
		const config = fields[name];
		const input = getField(name);
		if (!config || !input) return "";

		const message = config.validate(input.value, input);
		setError(name, message);
		return message;
	}

	function showFormStatus(message, type) {
		if (!formStatus) return;
		formStatus.textContent = message;
		formStatus.classList.remove(
			"hidden",
			"border-red-200",
			"bg-red-50",
			"text-red-700",
			"border-emerald-200",
			"bg-emerald-50",
			"text-emerald-700"
		);

		if (type === "error") {
			formStatus.classList.add("border-red-200", "bg-red-50", "text-red-700");
		} else {
			formStatus.classList.add("border-emerald-200", "bg-emerald-50", "text-emerald-700");
		}
	}

	Object.keys(fields).forEach((name) => {
		const input = getField(name);
		if (!input) return;

		const eventName = input.tagName === "SELECT" ? "change" : "input";
		input.addEventListener(eventName, function () {
			if (formStatus) formStatus.classList.add("hidden");
			validateOne(name);
		});

		input.addEventListener("blur", function () {
			validateOne(name);
		});
	});

	form.addEventListener("submit", function (event) {
		event.preventDefault();

		let hasErrors = false;
		let firstInvalid = null;
		const invalidFields = [];

		Object.keys(fields).forEach((name) => {
			const msg = validateOne(name);
			if (msg) {
				hasErrors = true;
				invalidFields.push(fieldLabel(name));
				if (!firstInvalid) firstInvalid = getField(name);
			}
		});

		if (hasErrors) {
			showFormStatus(msg("statusErrorPrefix") + invalidFields.join(", ") + ".", "error");
			if (firstInvalid && typeof firstInvalid.focus === "function") firstInvalid.focus();
			return;
		}

		showFormStatus(msg("statusSuccess"), "success");
		alert(msg("statusSuccess"));
		form.reset();
		Object.keys(fields).forEach((name) => setError(name, ""));
	});

	window.addEventListener("hc:langchange", function () {
		Object.keys(fields).forEach((name) => {
			const input = getField(name);
			if (!input) return;
			if (input.value) validateOne(name);
		});
	});
})();
