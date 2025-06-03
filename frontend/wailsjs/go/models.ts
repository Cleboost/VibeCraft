export namespace main {
	
	export class GeneratorInfo {
	    name: string;
	    filename: string;
	
	    static createFrom(source: any = {}) {
	        return new GeneratorInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.filename = source["filename"];
	    }
	}

}

