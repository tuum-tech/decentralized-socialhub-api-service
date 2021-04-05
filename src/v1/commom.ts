

export interface TuumTechResponse {
    meta: {
        code: number,
        message: string
    },
    data: any
}

export function returnSuccess(res: any, data: any){
    res.send({
        meta: { code: 200, message: 'OK'},
        data
    });
}

export async function handleRoute(url:string, body:any, h:any, post:boolean = true) {

    let fetchResponse: any;
    if (post === true){
        fetchResponse = await fetch(url, {
            method: 'POST',
            headers: h,
            body: JSON.stringify(body),
         });
    } else {
        fetchResponse = await fetch(url, {
            method: 'GET',
            headers: h
         });
    }

    let profileApiResponse : any = null;
    try {

        const serviceResponse : any = await fetchResponse.json();

        if (isTuumApi(serviceResponse)){
            if (serviceResponse.meta.code === 200)
                profileApiResponse = serviceResponse.data;
            else {
                profileApiResponse = {
                    "status": '500 Internal Server Error',
                    "code": serviceResponse.meta.code,
                    "message": serviceResponse.meta.message
                }
            }
        } else {
            const status = serviceResponse._status;
                if (status)
                    if (status === "OK")
                        profileApiResponse = serviceResponse
                    else {

                        profileApiResponse = {
                            "status": '500 Internal Server Error',
                            "code": serviceResponse._error.code,
                            "message": serviceResponse._error.message
                    }
                        }
                else {
                    profileApiResponse = {
                        "status": '500 Internal Server Error',
                        "code": 404,
                        "message": "Server Error"
                    }
                }
        }
    } catch (e: any){
        profileApiResponse = {
            "status": '500 Internal Server Error',
            "code": 500,
            "message": JSON.stringify(e)
        }
    }

    return profileApiResponse;
}


export function isTuumApi(serviceResponse : any) {
    try {
        const tuumtechresponse = serviceResponse as TuumTechResponse;
        return serviceResponse.meta !== undefined;
    } catch(e: any){
        return false;
    }
}

