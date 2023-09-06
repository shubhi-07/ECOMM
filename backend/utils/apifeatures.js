class ApiFeatures {
  constructor(query, queryStr) {
    this.query = query;   //property of this class.
    this.queryStr = queryStr;
  }

  search() {
    const keyword = this.queryStr.keyword
      ? { //agar mil gaya.
          name: {
            $regex: this.queryStr.keyword,  //mongodb operator i.e regular expression
            $options: "i",         //i means case insensitive
          },
        }
      : {};

    this.query = this.query.find({ ...keyword });
    return this;   //means returning this class only.
  }

  filter() {
    const queryCopy = { ...this.queryStr }; // a copy is made so that og value remain conversed and dereferenced op is used so that actually value is copied.

    //   Removing some fields for category
    const removeFields = ["keyword", "page", "limit"];

    removeFields.forEach((key) => delete queryCopy[key]);  //means dlting removeFields from querycopy.

    // Filter For Price and Rating

    let queryStr = JSON.stringify(queryCopy); // converting in string
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (key) => `$${key}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  pagination(resultPerPage) {
    const currentPage = Number(this.queryStr.page) || 1;

    const skip = resultPerPage * (currentPage - 1);

    this.query = this.query.limit(resultPerPage).skip(skip);

    return this;
  }
}

module.exports = ApiFeatures;
