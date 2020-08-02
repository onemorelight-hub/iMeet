function validate(){
    if( document.myForm.username.value.trim() == "" ) {
        alert( "Please provide user name!" );
        document.myForm.username.focus() ;
        return false;
     }
     
    if((/\s/g.test(document.myForm.username.value.trim()))){
        alert( "User name can't contain space!" );
        document.myForm.username.focus() ;
        return false;
     }
  }