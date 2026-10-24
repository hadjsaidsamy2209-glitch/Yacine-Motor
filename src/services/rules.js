const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toUtcTime(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

function daysBetween(startIso, endIso) {
  return Math.round((toUtcTime(endIso) - toUtcTime(startIso)) / MS_PER_DAY);
}

function addDays(isoDate, days) {
  return new Date(toUtcTime(isoDate) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

function yearsBetween(fromIso, toIso) {
  const [fromYear, fromMonth, fromDay] = fromIso.split('-').map(Number);
  const [toYear, toMonth, toDay] = toIso.split('-').map(Number);
  const anniversaryReached =
    toMonth > fromMonth || (toMonth === fromMonth && toDay >= fromDay);
  return toYear - fromYear - (anniversaryReached ? 0 : 1);
}

function estimateTotal(vehicle, startIso, endIso) {
  const days = daysBetween(startIso, endIso);
  return { days, total: days * vehicle.prix_jour };
}

function earliestStart(vehicle, todayIso) {
  if (vehicle.disponible) {
    return todayIso;
  }
  if (!vehicle.indisponible_jusqu_au) {
    return null;
  }
  const dayAfterReturn = addDays(vehicle.indisponible_jusqu_au, 1);
  return dayAfterReturn > todayIso ? dayAfterReturn : todayIso;
}

function driverProblems(vehicle, driver, startIso) {
  const problems = [];

  if (vehicle.age_minimum && yearsBetween(driver.birthDate, startIso) < vehicle.age_minimum) {
    problems.push(`Ce véhicule demande ${vehicle.age_minimum} ans minimum à la date de début de location.`);
  }
  if (vehicle.permis_minimum_annees && yearsBetween(driver.licenseDate, startIso) < vehicle.permis_minimum_annees) {
    problems.push(`Ce véhicule demande ${vehicle.permis_minimum_annees} ans de permis minimum à la date de début de location.`);
  }

  return problems;
}


module.exports = { daysBetween, addDays, yearsBetween, estimateTotal, earliestStart, driverProblems };

