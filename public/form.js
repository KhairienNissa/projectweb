function submitData() {
    let name = document.getElementById('name').value;
    let email = document.getElementById('email').value;
    let notelp = document.getElementById('notelp').value;
    let subject = document.getElementById('combobox').value;
    let textarea = document.getElementById('textarea').value;

    console.log(name);
    console.log(email);
    console.log(notelp);
    console.log(subject);
    console.log(textarea);
    
 if (name == '') {
    return alert ('isikan namanya ya!')
} else if (email==''){
    return alert ('isikan emailnya ya!')
} else if (notelp == '') {
    return  alert ('isikan Phone Numbernya ya!')
} else if (subject == '') {
    return alert ('isikan Subjectnya ya!')
} else if (textarea== ''){
    return alert ('isikan messagesnya ya!')
}


let penerimaEmail = 'cacakhairien@gmail.com'

let a = document.createElement('a')

a.href =`mailto:${penerimaEmail}?subject=${subject}&body=Halo my name is ${name} ${textarea} please call me ${notelp}`

a.click()
}

let p1 = document.getElementsByTagNameNS('p')[0];
p1.style.textAlign ='justify';
