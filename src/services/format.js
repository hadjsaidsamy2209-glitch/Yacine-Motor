function formatPrice(amount) {
    return `${amount.toLocaleString('fr-FR')} €`;
}

function formatDate(isoDate) {
    return isoDate.split('-').reverse().join('/');
}

module.exports = {formatPrice, formatDate};