const { formatDate } = require('./format');
const { addDays, earliestStart, driverProblems } = require('./rules');

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 1000;
const PHONE_PATTERN = /^[0-9+().\s-]{6,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/; 

function cleanText(value) {
  return String(value ?? '').trim();
}

function isValidIsoDate(value) {
  return ISO_DATE_PATTERN.test(value) && addDays(value, 0) === value;
}

function identityErrors(values) {
  const errors = {};

  if (!values.name) {
    errors.name = 'Indiquez votre nom et prénom.';
  } else if (values.name.length > MAX_NAME_LENGTH) {
    errors.name = `Votre nom est trop long (${MAX_NAME_LENGTH} caractères maximum).`;
  }
  if (!PHONE_PATTERN.test(values.phone)) {
    errors.phone = 'Indiquez un numéro de téléphone valide.';
  }
  if (!EMAIL_PATTERN.test(values.email) || values.email.length > MAX_EMAIL_LENGTH) {
    errors.email = 'Indiquez une adresse email valide.';
  }
  if (values.message.length > MAX_MESSAGE_LENGTH) {
    errors.message = `Votre message est trop long (${MAX_MESSAGE_LENGTH} caractères maximum).`;
  }

  return errors;
}

function dateErrors(values, vehicle, todayIso) {
  const errors = {};
  const firstDay = earliestStart(vehicle, todayIso);

  if (!isValidIsoDate(values.startDate)) {
    errors.startDate = 'Indiquez la date de début.';
  } else if (!firstDay) {
    errors.startDate = "Ce véhicule n'est pas réservable pour le moment.";
  } else if (values.startDate < firstDay) {
    errors.startDate = `La location peut commencer à partir du ${formatDate(firstDay)}.`;
  }

  if (!isValidIsoDate(values.endDate)) {
    errors.endDate = 'Indiquez la date de fin.';
  } else if (!errors.startDate && values.endDate <= values.startDate) {
    errors.endDate = 'La date de fin doit être après la date de début.';
  }

  return errors;
}

function driverInfoErrors(values, vehicle) {
  const errors = {};
  const hasConditions = Boolean(vehicle.age_minimum || vehicle.permis_minimum_annees);

  if (hasConditions && !isValidIsoDate(values.birthDate)) {
    errors.birthDate = 'Indiquez votre date de naissance.';
  }
  if (hasConditions && !isValidIsoDate(values.licenseDate)) {
    errors.licenseDate = "Indiquez la date d'obtention de votre permis.";
  }

  return errors;
}

function validateReservation(form, vehicle, todayIso) {
  const values = {
    name: cleanText(form.name),
    phone: cleanText(form.phone),
    email: cleanText(form.email),
    startDate: cleanText(form.startDate),
    endDate: cleanText(form.endDate),
    birthDate: cleanText(form.birthDate),
    licenseDate: cleanText(form.licenseDate),
    message: cleanText(form.message),
  };

  const errors = {
    ...identityErrors(values),
    ...dateErrors(values, vehicle, todayIso),
    ...driverInfoErrors(values, vehicle),
  };

  // L'âge et le permis ne se calculent que si les trois dates nécessaires sont valides.
  if (!errors.startDate && !errors.birthDate && !errors.licenseDate) {
    const problems = driverProblems(
      vehicle,
      { birthDate: values.birthDate, licenseDate: values.licenseDate },
      values.startDate,
    );
    if (problems.length > 0) {
      errors.conditions = problems.join(' ');
    }
  }

  if (form.consent !== 'on') {
    errors.consent = "Vous devez accepter que vos données soient transmises à l'agence.";
  }

  return { errors, values };
}

function nameError(value, label) {
  if (!value) {
    return `Indiquez votre ${label}.`;
  }
  if (value.length > MAX_NAME_LENGTH) {
    return `Votre ${label} est trop long (${MAX_NAME_LENGTH} caractères maximum).`;
  }
  return null;
}

// Formulaire de contact : prénom, nom, téléphone, email et message, tous obligatoires.
function validateContact(form) {
  const values = {
    firstName: cleanText(form.firstName),
    lastName: cleanText(form.lastName),
    phone: cleanText(form.phone),
    email: cleanText(form.email),
    message: cleanText(form.message),
  };
  const errors = {};

  const firstNameProblem = nameError(values.firstName, 'prénom');
  if (firstNameProblem) {
    errors.firstName = firstNameProblem;
  }
  const lastNameProblem = nameError(values.lastName, 'nom');
  if (lastNameProblem) {
    errors.lastName = lastNameProblem;
  }
  if (!PHONE_PATTERN.test(values.phone)) {
    errors.phone = 'Indiquez un numéro de téléphone valide.';
  }
  if (!EMAIL_PATTERN.test(values.email) || values.email.length > MAX_EMAIL_LENGTH) {
    errors.email = 'Indiquez une adresse email valide.';
  }
  if (!values.message) {
    errors.message = 'Écrivez votre message.';
  } else if (values.message.length > MAX_MESSAGE_LENGTH) {
    errors.message = `Votre message est trop long (${MAX_MESSAGE_LENGTH} caractères maximum).`;
  }
  if (form.consent !== 'on') {
    errors.consent = "Vous devez accepter que vos données soient transmises à l'agence.";
  }

  return { errors, values };
}

module.exports = { validateReservation, validateContact, isValidIsoDate };

