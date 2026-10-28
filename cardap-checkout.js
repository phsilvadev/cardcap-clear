(() => {
  const params = new URLSearchParams(location.search);
  const stores = ['Quintal da Mesa','Ponto do Burger','Forno & Massa','Café da Esquina','Doce Encontro','Tempero de Casa'];
  const store = stores.includes(params.get('store')) ? params.get('store') : stores[0];
  const step = document.body.dataset.step;
  const cartKey = 'cardap-demo-cart:' + encodeURIComponent(store);
  const draftKey = 'cardap-demo-checkout:' + encodeURIComponent(store);
  const orderKey = 'cardap-demo-order:' + encodeURIComponent(store);
  params.set('store', store);
  const url = page => 'cardap-' + page + '.html?' + params.toString();
  const money = cents => new Intl.NumberFormat('pt-BR', {style:'currency',currency:'BRL'}).format(cents/100);
  const read = (storage,key,fallback) => {try {return JSON.parse(storage.getItem(key)) ?? fallback;} catch {return fallback;}};
  const readCart = () => {
    const cart = read(localStorage,cartKey,[]);
    return Array.isArray(cart) ? cart.filter(item => item && typeof item.name==='string' && item.name.length<=100 && Number.isInteger(item.quantity) && item.quantity>0 && item.quantity<=99 && Number.isFinite(item.price) && item.price>0 && item.price<100000) : [];
  };
  let cart = readCart();
  let draft = read(sessionStorage,draftKey,null);
  let order = read(sessionStorage,orderKey,null);
  if (!draft || typeof draft!=='object' || !['delivery','pickup'].includes(draft.fulfillment) || typeof draft.customer!=='string' || typeof draft.phone!=='string' || typeof draft.address!=='string') draft=null;
  if (!order || typeof order!=='object' || !Array.isArray(order.items) || !['pix','card','cash'].includes(order.payment) || !Number.isSafeInteger(order.total) || typeof order.customer!=='string') order=null;
  const status = message => {const node=document.querySelector('#flow-status');if(node)node.textContent=message;};
  const total = items => items.reduce((sum,item)=>sum+Math.round(item.price*100)*item.quantity,0);
  const line = (label,value) => {const row=document.createElement('div');row.className='summary-line';const left=document.createElement('span');left.textContent=label;const right=document.createElement('span');right.textContent=value;row.append(left,right);return row;};
  const summary = items => {
    document.querySelector('#summary-store').textContent=store;
    const list=document.querySelector('#summary-items');list.replaceChildren();
    items.forEach(item=>list.append(line(item.quantity+' × '+item.name,money(Math.round(item.price*100)*item.quantity))));
    document.querySelector('#summary-total').textContent=money(total(items));
  };
  const saveCart = next => {try {localStorage.setItem(cartKey,JSON.stringify(next));cart=next;return true;}catch{status('Não foi possível salvar o carrinho neste navegador.');return false;}};
  document.querySelector('#back-link').href=url(step==='carrinho'?'loja':step==='checkout'?'carrinho':step==='pagamento'?'checkout':'loja');
  summary(step==='pedido-confirmado' && order ? order.items : cart);
  if(step==='carrinho') {
    const render = () => {
      const list=document.querySelector('#cart-lines');list.replaceChildren();
      cart.forEach((item,index)=>{
        const row=document.createElement('article');row.className='cart-line';
        const content=document.createElement('div');const title=document.createElement('h3');title.textContent=item.name;
        const unit=document.createElement('p');unit.textContent=money(Math.round(item.price*100))+' por unidade';
        const actions=document.createElement('div');actions.className='line-actions';
        const change = quantity => {const next=cart.map((entry,i)=>i===index?{...entry,quantity}:entry);if(saveCart(next))render();};
        const minus=document.createElement('button');minus.type='button';minus.textContent='−';minus.setAttribute('aria-label','Diminuir '+item.name);minus.disabled=item.quantity<=1;minus.onclick=()=>change(item.quantity-1);
        const qty=document.createElement('span');qty.textContent=item.quantity;
        const plus=document.createElement('button');plus.type='button';plus.textContent='+';plus.setAttribute('aria-label','Aumentar '+item.name);plus.disabled=item.quantity>=99;plus.onclick=()=>change(item.quantity+1);
        const remove=document.createElement('button');remove.type='button';remove.className='remove';remove.textContent='Remover';remove.setAttribute('aria-label','Remover '+item.name);remove.onclick=()=>{if(saveCart(cart.filter((_,i)=>i!==index)))render();};
        actions.append(minus,qty,plus,remove);content.append(title,unit,actions);
        const price=document.createElement('strong');price.textContent=money(Math.round(item.price*100)*item.quantity);row.append(content,price);list.append(row);
      });
      document.querySelector('#empty-cart').hidden=cart.length>0;
      const link=document.querySelector('#checkout-link');link.hidden=!cart.length;link.href=url('checkout');summary(cart);
    };
    document.querySelector('#load-example').onclick=()=>{if(saveCart([{name:'Produto de exemplo',price:29.9,quantity:1},{name:'Água mineral',price:4.9,quantity:1}])){status('Carrinho de exemplo carregado.');render();}};
    render();
  }
  if(step==='checkout') {
    const form=document.querySelector('#checkout-form');
    const demoUser=read(sessionStorage,'cardap-demo-user',null);
    if(!draft && demoUser?.id==='demo-customer' && demoUser?.demo===true)document.querySelector('#customer-name').value='Cliente de demonstração';
    if(draft){document.querySelector('#customer-name').value=draft.customer;document.querySelector('#customer-phone').value=draft.phone;document.querySelector('#customer-address').value=draft.address;document.querySelector('#order-notes').value=typeof draft.notes==='string'?draft.notes:'';form.querySelector('[value="'+draft.fulfillment+'"]').checked=true;}
    const toggle=()=>{const delivery=form.elements.fulfillment.value==='delivery';document.querySelector('#address-fields').hidden=!delivery;document.querySelector('#customer-address').required=delivery;document.querySelector('#pickup-note').hidden=delivery;};
    form.addEventListener('change',toggle);toggle();
    form.addEventListener('submit',event=>{
      event.preventDefault();cart=readCart();if(!cart.length){status('Seu carrinho está vazio. Volte ao carrinho para continuar.');return;}
      const customer=document.querySelector('#customer-name').value.trim();const phone=document.querySelector('#customer-phone');
      phone.setCustomValidity(/^\d{10,11}$/.test(phone.value.replace(/\D/g,''))?'':'Informe um telefone com DDD.');
      if(!form.reportValidity())return;if(customer.length<2){status('Informe seu nome.');return;}
      const fulfillment=form.elements.fulfillment.value;const address=document.querySelector('#customer-address').value.trim();
      if(fulfillment==='delivery' && address.length<5){status('Informe o endereço de entrega.');return;}
      try{sessionStorage.setItem(draftKey,JSON.stringify({customer,phone:phone.value.trim(),fulfillment,address:fulfillment==='delivery'?address:'',notes:document.querySelector('#order-notes').value.trim()}));location.href=url('pagamento');}catch{status('Não foi possível salvar seus dados neste navegador.');}
    });
    document.querySelector('#customer-phone').addEventListener('input',event=>event.target.setCustomValidity(''));
  }
  const paymentNames={pix:'Pix',card:'Cartão na entrega ou retirada',cash:'Dinheiro'};
  if(step==='pagamento') {
    const form=document.querySelector('#payment-form');
    const descriptions={pix:'Nesta prévia, nenhum código Pix será gerado e nenhuma transferência será solicitada.',card:'Pagamento presencial ilustrativo. Não é necessário informar número de cartão, validade ou código de segurança.',cash:'Pagamento em dinheiro ilustrativo. A confirmação e o troco serão combinados com a loja.'};
    const update=()=>{document.querySelector('#payment-description').textContent=descriptions[form.elements.payment.value];};form.addEventListener('change',update);update();
    if(!draft || !cart.length){status('Preencha a entrega e adicione itens antes de continuar.');form.querySelector('[type="submit"]').disabled=true;}
    else document.querySelector('#delivery-review').textContent=draft.customer+'\n'+(draft.fulfillment==='pickup'?'Retirar na loja':draft.address);
    form.addEventListener('submit',event=>{
      event.preventDefault();cart=readCart();if(!draft || !cart.length){status('Confira seus dados e o carrinho antes de continuar.');return;}
      const button=form.querySelector('[type="submit"]');button.disabled=true;
      try{const record={id:'DEMO-'+Date.now().toString(36).toUpperCase(),customer:draft.customer,fulfillment:draft.fulfillment,address:draft.address,payment:form.elements.payment.value,items:cart,total:total(cart)};sessionStorage.setItem(orderKey,JSON.stringify(record));localStorage.removeItem(cartKey);sessionStorage.removeItem(draftKey);location.href=url('pedido-confirmado');}catch{button.disabled=false;status('Não foi possível concluir a simulação. Tente novamente.');}
    });
  }
  if(step==='pedido-confirmado'){
    document.querySelector('#return-store').href=url('loja');
    if(order)document.querySelector('#confirmation-details').textContent=order.id+'\n'+order.customer+'\n'+(order.fulfillment==='pickup'?'Retirada na loja':order.address)+'\nForma escolhida: '+paymentNames[order.payment]+'\nStatus: demonstração, sem pagamento';
    else {document.querySelector('#confirmation-title').textContent='Nenhuma simulação concluída';document.querySelector('#confirmation-details').textContent='Comece pelo carrinho para explorar o fluxo.';summary([]);}
  }
})();
