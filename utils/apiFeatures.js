class APIFeatures{
    constructor(query,queryString){
        this.query = query;
        this.queryString = queryString;        
    }
    filter(){        
        // 1.filter
        const queryObject = {...this.queryString};
        const exculdedFields = ['select', 'sort', 'page', 'limit', 'fields'];        
        exculdedFields.forEach(el=>delete queryObject[el]);        
        
        // 2. advanced filtering
        let queryStr = JSON.stringify(queryObject);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`); 
        this.query = this.query.find(JSON.parse(queryStr));        
        return this;
    }
    
    sort(){        
        // 3. sort
        if(this.queryString.sort){
            console.log(this.queryString.sort)
            let sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);   
        }else{
            this.query = this.query.sort('-createdAt');
        }                
        return this;        
    }
    
    limitFields(){
        // 4. fields limit
        if(this.queryString.fields){
            let fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);   
        }else{
            this.query = this.query.select('-__v');
        }
        return this;
    }
    
    pagenation(){
        // 5.pagination
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const skip = limit * (page - 1);
        this.query = this.query.skip(skip);        
        this.query = this.query.limit(limit); 
        return this;                
    }
}

module.exports = APIFeatures;