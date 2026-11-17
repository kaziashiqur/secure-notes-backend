// page/limit from query, limit capped at 100
function getPagination(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

function pageResult(data, total, { page, limit }) {
  return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
}

module.exports = { getPagination, pageResult };
