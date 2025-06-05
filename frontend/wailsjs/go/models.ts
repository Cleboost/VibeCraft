export namespace autoupdater {
	
	export class UpdateInfo {
	    available: boolean;
	    currentVersion: string;
	    latestVersion: string;
	    releaseNotes: string;
	    downloadUrl: string;
	    releaseUrl: string;
	    size: number;
	
	    static createFrom(source: any = {}) {
	        return new UpdateInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.available = source["available"];
	        this.currentVersion = source["currentVersion"];
	        this.latestVersion = source["latestVersion"];
	        this.releaseNotes = source["releaseNotes"];
	        this.downloadUrl = source["downloadUrl"];
	        this.releaseUrl = source["releaseUrl"];
	        this.size = source["size"];
	    }
	}

}

export namespace main {
	
	export class ChangelogResult {
	    shouldShow: boolean;
	    version: string;
	    error: string;
	
	    static createFrom(source: any = {}) {
	        return new ChangelogResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.shouldShow = source["shouldShow"];
	        this.version = source["version"];
	        this.error = source["error"];
	    }
	}
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

