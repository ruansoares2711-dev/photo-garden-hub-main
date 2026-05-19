# Notas de análise — Photo Garden Hub

## Documentação Mercado Pago consultada

A documentação oficial do Checkout Pro confirma que `back_urls` deve conter URLs públicas controladas pela aplicação para os estados `success`, `failure` e `pending`. A documentação também alerta que domínios locais como `localhost` ou `127.0.0.1` não devem ser usados em `back_urls`, pois o retorno pode falhar no fluxo de pagamento.

As URLs de retorno recebem parâmetros por `GET`, incluindo `payment_id`, `status`, `external_reference`, `merchant_order_id` e `preference_id`. Portanto, a tela de sucesso pode usar esses dados como fallback para reconciliar o pagamento quando o webhook ainda não atualizou o banco.

A documentação de notificações indica que Webhooks enviam eventos por `POST` quando um pagamento é criado ou tem status alterado, incluindo estados como `pending`, `rejected` e `approved`. O endpoint deve buscar o pagamento no Mercado Pago usando o identificador recebido e atualizar o pedido local com base em `external_reference`.
