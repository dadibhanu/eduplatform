import React from 'react';


export default function Loader(){
return (
<div className="loader-wrapper d-flex justify-content-center align-items-center" style={{minHeight:'60vh'}}>
<div className="spinner-border text-light me-2" role="status"></div>
<span className="fs-5 text-light">Loading...</span>
</div>
);
}